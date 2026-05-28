import { useCallback, useState } from 'react'
import { cn } from '@/lib/utils'
import { Search, X } from 'lucide-react'
import { useTranslation } from '@/i18n'
import type { SearchFilters } from '@/types/clockwork'

interface FilterBarProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  className?: string
}

export function FilterBar({ filters, onFiltersChange, className }: FilterBarProps) {
  const { t } = useTranslation()
  const [searchInput, setSearchInput] = useState(filters.search ?? '')

  const updateFilter = useCallback(
    (key: string, value: string | string[] | undefined) => {
      onFiltersChange({ ...filters, [key]: value || undefined })
    },
    [filters, onFiltersChange],
  )

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value)
      updateFilter('search', value || undefined)
    },
    [updateFilter],
  )

  const handleClear = useCallback(() => {
    setSearchInput('')
    onFiltersChange({})
  }, [onFiltersChange])

  const hasActiveFilters =
    filters.search ||
    filters.type?.length ||
    filters.status?.length ||
    filters.durationRange ||
    filters.timeStart ||
    filters.timeEnd ||
    filters.method?.length

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center gap-1.5">
        {/* Search input */}
        <div className="flex items-center gap-1.5 flex-1 rounded-md border border-input/80 bg-background px-2.5 py-1 text-sm focus-within:border-ring/60 focus-within:ring-1 focus-within:ring-ring/30 transition-colors duration-150">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={t('filter.search')}
            className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </div>

        {/* Type select */}
        <FilterSelect
          value={filters.type?.[0] ?? ''}
          onChange={(v) => updateFilter('type', v ? [v] : undefined)}
          placeholder={t('filter.type')}
          options={[
            { value: 'request', label: t('type.request') },
            { value: 'command', label: t('type.command') },
            { value: 'queue-job', label: t('type.queue-job') },
            { value: 'test', label: t('type.test') },
          ]}
        />

        {/* Status select */}
        <FilterSelect
          value={filters.status?.[0] ?? ''}
          onChange={(v) => updateFilter('status', v ? [v] : undefined)}
          placeholder={t('filter.status')}
          options={[
            { value: '2', label: t('filter.status.2xx') },
            { value: '3', label: t('filter.status.3xx') },
            { value: '4', label: t('filter.status.4xx') },
            { value: '5', label: t('filter.status.5xx') },
          ]}
        />

        {/* Duration select */}
        <FilterSelect
          value={filters.durationRange ?? ''}
          onChange={(v) => updateFilter('durationRange', v || undefined)}
          placeholder={t('filter.duration')}
          options={[
            { value: 'fast', label: t('filter.duration.fast') },
            { value: 'normal', label: t('filter.duration.normal') },
            { value: 'slow', label: t('filter.duration.slow') },
          ]}
        />

        {/* Method select */}
        <FilterSelect
          value={filters.method?.[0] ?? ''}
          onChange={(v) => updateFilter('method', v ? [v] : undefined)}
          placeholder={t('filter.method')}
          options={[
            { value: 'GET', label: 'GET' },
            { value: 'POST', label: 'POST' },
            { value: 'PUT', label: 'PUT' },
            { value: 'PATCH', label: 'PATCH' },
            { value: 'DELETE', label: 'DELETE' },
          ]}
        />

        {/* Time range */}
        <input
          type="datetime-local"
          value={filters.timeStart ?? ''}
          onChange={(e) => updateFilter('timeStart', e.target.value || undefined)}
          className="shrink-0 rounded-md border border-input/80 bg-background px-2 py-1.5 text-sm min-w-[140px] outline-none focus:border-ring/60 focus:ring-1 focus:ring-ring/30 cursor-pointer transition-colors duration-150"
          title={t('filter.timeStart')}
        />
        <span className="text-sm text-muted-foreground shrink-0">~</span>
        <input
          type="datetime-local"
          value={filters.timeEnd ?? ''}
          onChange={(e) => updateFilter('timeEnd', e.target.value || undefined)}
          className="shrink-0 rounded-md border border-input/80 bg-background px-2 py-1.5 text-sm min-w-[140px] outline-none focus:border-ring/60 focus:ring-1 focus:ring-ring/30 cursor-pointer transition-colors duration-150"
          title={t('filter.timeEnd')}
        />

        {/* Clear all */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="shrink-0 rounded-md border border-input/80 bg-background px-2 py-1 text-xs outline-none focus:border-ring/60 focus:ring-1 focus:ring-ring/30 cursor-pointer transition-colors duration-150"
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
