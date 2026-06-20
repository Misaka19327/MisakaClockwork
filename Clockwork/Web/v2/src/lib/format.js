// Formatting helpers shared across pages (ported from the prototype's inline JS).

// HTTP / command status → badge class
export function statusClass(s) {
  if (s === '—' || s == null) return 's--'
  const n = typeof s === 'number' ? s : parseInt(s, 10)
  if (Number.isNaN(n)) return 's--'
  if (n >= 500) return 's5xx'
  if (n >= 400) return 's4xx'
  if (n >= 300) return 's3xx'
  return 's2xx'
}

// Duration → human string ("1.2 ms", "2.3 s", "—")
export function durStr(d) {
  if (d == null) return '—'
  if (d < 1) return '—'
  return d < 1000 ? d.toFixed(1) + ' ms' : (d / 1000).toFixed(1) + ' s'
}

// Memory (MB) → human string
export function memStr(m) {
  if (m == null) return '—'
  return m < 1 ? '—' : (m >= 10 ? m.toFixed(0) : m.toFixed(1)) + ' MB'
}

// Slow duration modifier (>500ms)
export function durSlowClass(d) {
  return d > 500 ? ' slow' : ''
}

// Duration micro-bar {cls, widthPx}
export function durBar(d) {
  const w = Math.min(d / 20, 60)
  const cls = d < 100 ? 'fast' : d < 500 ? 'med' : 'slow'
  return { cls, widthPx: Math.max(w, 4) }
}

export function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
