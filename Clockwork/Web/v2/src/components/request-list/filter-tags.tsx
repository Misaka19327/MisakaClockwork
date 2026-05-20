import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import type { SearchFilters } from '@/types/clockwork'

interface FilterTagsProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  className?: string
}

const FILTER_KEYS: (keyof SearchFilters)[] = [
  'uri',
  'controller',
  'method',
  'status',
  'time',
  'received',
  'type',
  'name',
]

const tagColors: Record<string, string> = {
  uri: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  controller: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  method: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  status: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  time: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
  received: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
  type: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  name: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300',
}

export function FilterTags({ filters, onFiltersChange, className }: FilterTagsProps) {
  const tags: { key: keyof SearchFilters; value: string }[] = []

  for (const key of FILTER_KEYS) {
    const values = filters[key]
    if (values) {
      for (const v of values) {
        tags.push({ key, value: v })
      }
    }
  }

  if (tags.length === 0) return null

  const removeTag = (key: keyof SearchFilters, value: string) => {
    const currentValues = filters[key] ?? []
    const newValues = currentValues.filter((v) => v !== value)
    const newFilters = { ...filters }
    if (newValues.length === 0) {
      delete newFilters[key]
    } else {
      newFilters[key] = newValues
    }
    onFiltersChange(newFilters)
  }

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {tags.map(({ key, value }) => (
        <span
          key={`${key}:${value}`}
          className={cn(
            'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium',
            tagColors[key] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
          )}
        >
          <span className="opacity-60">{key}:</span>
          {value}
          <button
            type="button"
            onClick={() => removeTag(key, value)}
            className="ml-0.5 rounded p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}
    </div>
  )
}
