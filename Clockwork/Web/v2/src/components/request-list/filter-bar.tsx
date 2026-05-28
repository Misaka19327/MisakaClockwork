import { useCallback, useState } from 'react'
import { cn } from '@/lib/utils'
import { Search, X, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { useTranslation } from '@/i18n'
import type { SearchFilters } from '@/types/clockwork'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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

export function FilterBar({ filters, onFiltersChange, className }: FilterBarProps) {
  const { t } = useTranslation()
  const [searchInput, setSearchInput] = useState(filters.search ?? '')

  const update = useCallback(
    (key: string, value: string | string[] | undefined) =>
      onFiltersChange({ ...filters, [key]: value || undefined }),
    [filters, onFiltersChange],
  )

  const active =
    filters.search || filters.type?.length || filters.status?.length ||
    filters.durationRange || filters.timeStart || filters.timeEnd || filters.method?.length

  const startDate = filters.timeStart ? new Date(filters.timeStart) : undefined
  const endDate = filters.timeEnd ? new Date(filters.timeEnd) : undefined

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[140px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); update('search', e.target.value || undefined) }}
            placeholder={t('filter.search')}
            className="pl-8 h-8 text-xs"
          />
        </div>

        {/* Type */}
        <Select value={filters.type?.[0] ?? ''} onValueChange={(v) => update('type', v ? [v] : undefined)}>
          <SelectTrigger className="h-8 w-auto min-w-[80px] text-xs">
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

        {/* Status */}
        <Select value={filters.status?.[0] ?? ''} onValueChange={(v) => update('status', v ? [v] : undefined)}>
          <SelectTrigger className="h-8 w-auto min-w-[80px] text-xs">
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

        {/* Duration */}
        <Select value={filters.durationRange ?? ''} onValueChange={(v) => update('durationRange', v || undefined)}>
          <SelectTrigger className="h-8 w-auto min-w-[80px] text-xs">
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

        {/* Method */}
        <Select value={filters.method?.[0] ?? ''} onValueChange={(v) => update('method', v ? [v] : undefined)}>
          <SelectTrigger className="h-8 w-auto min-w-[80px] text-xs">
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

        {/* Start date */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn('h-8 justify-start text-left font-normal text-xs min-w-[130px]', !startDate && 'text-muted-foreground')}
            >
              <CalendarIcon data-icon="inline-start" />
              {startDate ? format(startDate, 'MM-dd HH:mm') : t('filter.timeStart')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
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

        {/* End date */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn('h-8 justify-start text-left font-normal text-xs min-w-[130px]', !endDate && 'text-muted-foreground')}
            >
              <CalendarIcon data-icon="inline-start" />
              {endDate ? format(endDate, 'MM-dd HH:mm') : t('filter.timeEnd')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
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

        {/* Clear */}
        {active && (
          <Button variant="ghost" size="icon" onClick={() => { setSearchInput(''); onFiltersChange({}) }} className="size-8 shrink-0">
            <X />
          </Button>
        )}
      </div>
    </div>
  )
}
