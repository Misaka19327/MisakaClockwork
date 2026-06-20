// Overview (index) page mock data — ported from index.html.

export const STATUS = {
  rate: '4.3 req/s',
  storage: 'files',
  lastCollectedSeconds: 2,
}

export const KPIS = [
  { label: '请求总数', value: '1,247', trend: { dir: 'up', text: '▲ 12%' }, sub: ['较昨日', ' +134'] },
  { label: '失败请求', value: '23',     trend: { dir: 'warn', text: '▸ 3%' }, sub: ['错误率', ' 1.8%'] },
  { label: '平均耗时', value: '87',     trend: { dir: 'down', text: '▼ 8%' }, sub: ['单位 ms'] },
  { label: '数据库查询', value: '5.8k', trend: { dir: 'up', text: '▲ 6%' }, sub: ['慢查询', ' 31 ', '条'] },
]

export const RECENT = [
  { method: 'GET',    uri: '/api/orders?status=pending&page=2', type: 'request', status: 200, duration: 342 },
  { method: 'POST',   uri: '/admin/users',                      type: 'request', status: 201, duration: 128 },
  { method: 'GET',    uri: '/demo',                             type: 'request', status: 500, duration: 512 },
  { method: '—',      uri: 'migrate --force',                   type: 'command', status: 0,  duration: 2100 },
  { method: 'POST',   uri: '/api/checkout',                     type: 'request', status: 422, duration: 94 },
]
