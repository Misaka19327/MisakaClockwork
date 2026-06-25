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
  // Storage (Redis hGetAll / PDO) returns numbers as strings, so coerce before formatting —
  // otherwise "48.2".toFixed throws. null/undefined/""/non-numeric → em-dash.
  d = Number(d)
  if (!Number.isFinite(d)) return '—'
  if (d < 1) return '—'
  return d < 1000 ? d.toFixed(1) + ' ms' : (d / 1000).toFixed(1) + ' s'
}

// Memory (MB) → human string
export function memStr(m) {
  // See durStr — coerce string numbers from storage before calling toFixed.
  m = Number(m)
  if (!Number.isFinite(m)) return '—'
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

// If a string is a JSON object/array — directly (`{"a":1}` / `[1,2]`) or a JSON string literal
// wrapping one (`"[{\"a\":1}]"`) — return it pretty-printed; otherwise return the original string
// unchanged (scalars, PHP-serialized blobs, malformed JSON pass through).
export function prettyJsonValue(raw) {
  if (raw == null) return raw
  const s = String(raw).trim()
  if (!s) return s
  const tryFormat = (str) => {
    if (!str || (str[0] !== '{' && str[0] !== '[')) return null
    try {
      const parsed = JSON.parse(str)
      return parsed && typeof parsed === 'object' ? JSON.stringify(parsed, null, 2) : null
    } catch (_) { return null }
  }
  const direct = tryFormat(s)
  if (direct != null) return direct
  // A JSON string literal ("...") may wrap a JSON object/array — decode one level and retry.
  if (s.length >= 2 && s[0] === '"' && s[s.length - 1] === '"') {
    try {
      const inner = JSON.parse(s)
      if (typeof inner === 'string') {
        const unwrapped = tryFormat(inner.trim())
        if (unwrapped != null) return unwrapped
      }
    } catch (_) { /* not a JSON string literal */ }
  }
  return s
}

// Pretty-print any value for code-block display: objects/arrays → indented JSON; strings →
// prettyJsonValue (beautifies embedded JSON, leaves the rest); null → null.
export function prettyVal(v) {
  if (v == null) return null
  if (typeof v === 'object') {
    try { return JSON.stringify(v, null, 2) } catch (_) { return String(v) }
  }
  return prettyJsonValue(v)
}
