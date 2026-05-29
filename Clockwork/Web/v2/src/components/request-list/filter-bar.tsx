import { useCallback, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Search, X, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { useTranslation } from '@/i18n'
import type { PollingIntervalOption, SearchFilters } from '@/types/clockwork'
import { useSettingsStore } from '@/stores/settings-store'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'

interface FilterBarProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  className?: string
}

function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function parseTime(v: string): { h: number; m: number } | null {
  const p = v.split(':')
  if (p.length !== 2) return null
  const h = Number(p[0]); const m = Number(p[1])
  if (isNaN(h) || isNaN(m)) return null
  return { h, m }
}

function serializeList(values?: string[]): string {
  return values?.join(', ') ?? ''
}

function parseList(value: string): string[] | undefined {
  const items = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  return items.length > 0 ? items : undefined
}

const pollingIntervals: { value: PollingIntervalOption; label: string }[] = [
  { value: '1000', label: '1s' },
  { value: '5000', label: '5s' },
  { value: '10000', label: '10s' },
  { value: '30000', label: '30s' },
  { value: '60000', label: '1m' },
  { value: '120000', label: '2m' },
  { value: '180000', label: '3m' },
  { value: '240000', label: '4m' },
  { value: '300000', label: '5m' },
  { value: '360000', label: '6m' },
  { value: '420000', label: '7m' },
  { value: '480000', label: '8m' },
  { value: '540000', label: '9m' },
  { value: '600000', label: '10m' },
]

export function FilterBar({ filters, onFiltersChange, className }: FilterBarProps) {
  const { t } = useTranslation()
  const pollingEnabled = useSettingsStore((s) => s.pollingEnabled)
  const pollingInterval = useSettingsStore((s) => s.pollingInterval)
  const setPollingEnabled = useSettingsStore((s) => s.setPollingEnabled)
  const setPollingInterval = useSettingsStore((s) => s.setPollingInterval)
  const [searchInput, setSearchInput] = useState(filters.search ?? '')
  const [uriInput, setUriInput] = useState(serializeList(filters.uri))
  const [controllerInput, setControllerInput] = useState(serializeList(filters.controller))
  const [nameInput, setNameInput] = useState(serializeList(filters.name))

  useEffect(() => {
    setSearchInput(filters.search ?? '')
    setUriInput(serializeList(filters.uri))
    setControllerInput(serializeList(filters.controller))
    setNameInput(serializeList(filters.name))
  }, [filters.search, filters.uri, filters.controller, filters.name])

  const update = useCallback(
    (key: string, value: string | string[] | undefined) =>
      onFiltersChange({ ...filters, [key]: value || undefined }),
    [filters, onFiltersChange],
  )

  const active =
    filters.search || filters.type?.length || filters.status?.length ||
    filters.durationRange || filters.timeStart || filters.timeEnd || filters.method?.length ||
    filters.uri?.length || filters.controller?.length || filters.name?.length
  const activeCount = [
    filters.search,
    filters.type?.length,
    filters.status?.length,
    filters.durationRange,
    filters.timeStart,
    filters.timeEnd,
    filters.method?.length,
    filters.uri?.length,
    filters.controller?.length,
    filters.name?.length,
  ].filter(Boolean).length

  const startDate = filters.timeStart ? new Date(filters.timeStart) : undefined
  const endDate = filters.timeEnd ? new Date(filters.timeEnd) : undefined

  return (
    <div className={cn('rounded-2xl border border-border/70 bg-sidebar-background/70 p-3 shadow-sm backdrop-blur-sm', className)}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {t('filter.search')}
              </Label>
              {active && (
                <span className="rounded-full border border-border/70 bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {t('filter.active')}: {activeCount}
                </span>
              )}
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => { setSearchInput(e.target.value); update('search', e.target.value || undefined) }}
                placeholder={t('filter.search')}
                className="h-10 pl-8 text-xs"
              />
            </div>
            <p className="text-[11px] leading-4 text-muted-foreground">
              {t('filter.searchHint')}
            </p>
          </div>

          <div className="flex min-w-[280px] flex-1 items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/80 px-3 py-2.5">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {t('filter.polling')}
              </div>
              <div className="text-xs text-muted-foreground">
                {pollingEnabled ? t('filter.pollingOn') : t('filter.pollingOff')}
              </div>
            </div>
            <Switch checked={pollingEnabled} onCheckedChange={setPollingEnabled} />
            <Select value={pollingInterval} onValueChange={(v) => setPollingInterval(v as PollingIntervalOption)}>
              <SelectTrigger className="h-8 w-[92px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {pollingIntervals.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          <Select value={filters.type?.[0] ?? ''} onValueChange={(v) => update('type', v ? [v] : undefined)}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder={t('filter.type')} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="request">{t('type.request')}</SelectItem>
                <SelectItem value="command">{t('type.command')}</SelectItem>
                <SelectItem value="queue-job">{t('type.queue-job')}</SelectItem>
                <SelectItem value="test">{t('type.test')}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select value={filters.status?.[0] ?? ''} onValueChange={(v) => update('status', v ? [v] : undefined)}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder={t('filter.status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="2">{t('filter.status.2xx')}</SelectItem>
                <SelectItem value="3">{t('filter.status.3xx')}</SelectItem>
                <SelectItem value="4">{t('filter.status.4xx')}</SelectItem>
                <SelectItem value="5">{t('filter.status.5xx')}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select value={filters.method?.[0] ?? ''} onValueChange={(v) => update('method', v ? [v] : undefined)}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder={t('filter.method')} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select value={filters.durationRange ?? ''} onValueChange={(v) => update('durationRange', v || undefined)}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder={t('filter.duration')} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="fast">{t('filter.duration.fast')}</SelectItem>
                <SelectItem value="normal">{t('filter.duration.normal')}</SelectItem>
                <SelectItem value="slow">{t('filter.duration.slow')}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2 lg:grid-cols-3">
          <Input
            value={uriInput}
            onChange={(e) => {
              const value = e.target.value
              setUriInput(value)
              update('uri', parseList(value))
            }}
            placeholder={t('filter.uri')}
            className="h-9 text-xs"
          />
          <Input
            value={controllerInput}
            onChange={(e) => {
              const value = e.target.value
              setControllerInput(value)
              update('controller', parseList(value))
            }}
            placeholder={t('filter.controller')}
            className="h-9 text-xs"
          />
          <Input
            value={nameInput}
            onChange={(e) => {
              const value = e.target.value
              setNameInput(value)
              update('name', parseList(value))
            }}
            placeholder={t('filter.name')}
            className="h-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{t('filter.time')}</span>
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn('h-9 justify-start text-left font-normal text-xs min-w-[138px]', !startDate && 'text-muted-foreground')}
                  >
                    <CalendarIcon data-icon="inline-start" />
                    {startDate ? format(startDate, 'MM-dd HH:mm') : t('filter.timeStart')}
                  </Button>
                }
              />
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    if (date) {
                      const d = new Date(date)
                      if (startDate) { d.setHours(startDate.getHours(), startDate.getMinutes()) }
                      update('timeStart', toDatetimeLocal(d))
                    }
                  }}
                />
                {startDate && (
                  <div className="border-t p-2">
                    <input
                      type="time"
                      value={`${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`}
                      onChange={(e) => {
                        const t = parseTime(e.target.value)
                        if (t) { const d = new Date(startDate); d.setHours(t.h, t.m); update('timeStart', toDatetimeLocal(d)) }
                      }}
                      className="w-full rounded border border-input bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                )}
              </PopoverContent>
            </Popover>

            <span className="text-xs text-muted-foreground shrink-0">~</span>

            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn('h-9 justify-start text-left font-normal text-xs min-w-[138px]', !endDate && 'text-muted-foreground')}
                  >
                    <CalendarIcon data-icon="inline-start" />
                    {endDate ? format(endDate, 'MM-dd HH:mm') : t('filter.timeEnd')}
                  </Button>
                }
              />
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => {
                    if (date) {
                      const d = new Date(date)
                      if (endDate) { d.setHours(endDate.getHours(), endDate.getMinutes()) }
                      update('timeEnd', toDatetimeLocal(d))
                    }
                  }}
                />
                {endDate && (
                  <div className="border-t p-2">
                    <input
                      type="time"
                      value={`${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`}
                      onChange={(e) => {
                        const t = parseTime(e.target.value)
                        if (t) { const d = new Date(endDate); d.setHours(t.h, t.m); update('timeEnd', toDatetimeLocal(d)) }
                      }}
                      className="w-full rounded border border-input bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          {active && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchInput('')
                setUriInput('')
                setControllerInput('')
                setNameInput('')
                onFiltersChange({})
              }}
              className="ml-auto h-9 px-3 text-xs"
            >
              <X className="mr-1 h-3.5 w-3.5" />
              {t('filter.clear')}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
