import { cn } from '@/lib/utils'
import { useTranslation } from '@/i18n'
import type { SearchFilters } from '@/types/clockwork'

interface FilterTagsProps {
  filters: SearchFilters
  className?: string
  compact?: boolean
}

const filterLabelMap: Record<string, string> = {
  type: 'badge.type',
  status: 'badge.status',
  durationRange: 'badge.duration',
  method: 'badge.method',
  search: 'badge.search',
}

const tagColors: Record<string, string> = {
  type: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  status: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  durationRange: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
  method: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  search: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  uri: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  controller: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  name: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300',
}

function collectTags(filters: SearchFilters): { key: string; value: string }[] {
  const tags: { key: string; value: string }[] = []

  if (filters.search) {
    tags.push({ key: 'search', value: filters.search })
  }

  const arrayKeys = ['type', 'status', 'method', 'uri', 'controller', 'name'] as const
  for (const key of arrayKeys) {
    const values = filters[key]
    if (values) {
      for (const v of values) {
        tags.push({ key, value: v })
      }
    }
  }

  if (filters.durationRange) {
    tags.push({ key: 'durationRange', value: filters.durationRange })
  }

  if (filters.timeStart) {
    tags.push({ key: 'timeStart', value: filters.timeStart })
  }
  if (filters.timeEnd) {
    tags.push({ key: 'timeEnd', value: filters.timeEnd })
  }

  return tags
}

const durationLabels: Record<string, string> = {
  fast: '< 100ms',
  normal: '100ms - 1s',
  slow: '> 1s',
}

function getDisplayValue(key: string, value: string): string {
  if (key === 'durationRange') return durationLabels[value] ?? value
  if (key === 'status') return `${value}xx`
  return value
}

export function FilterTags({ filters, className, compact = false }: FilterTagsProps) {
  const { t } = useTranslation()
  const tags = collectTags(filters)

  if (tags.length === 0) return null

  return (
    <div
      className={cn(
        'flex flex-wrap gap-1 transition-all duration-300 overflow-hidden',
        compact ? 'max-h-6' : 'max-h-20',
        className,
      )}
    >
      {tags.map(({ key, value }) => (
        <span
          key={`${key}:${value}`}
          className={cn(
            'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium whitespace-nowrap',
            tagColors[key] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
          )}
        >
          <span className="opacity-60">{t((filterLabelMap[key] ?? key) as any)}：</span>
          {getDisplayValue(key, value)}
        </span>
      ))}
    </div>
  )
}
