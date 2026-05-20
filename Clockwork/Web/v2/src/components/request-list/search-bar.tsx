import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Search, X } from 'lucide-react'
import type { SearchFilters } from '@/types/clockwork'

interface SearchBarProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  className?: string
}

const FILTER_KEYS: (keyof SearchFilters)[] = [
  'controller',
  'method',
  'status',
  'time',
  'received',
  'type',
  'name',
  'uri',
]

function parseSearchInput(input: string): SearchFilters {
  const filters: SearchFilters = {}
  const tokens = input.split(/\s+/)

  for (const token of tokens) {
    const colonIndex = token.indexOf(':')
    if (colonIndex > 0) {
      const key = token.slice(0, colonIndex).toLowerCase()
      const value = token.slice(colonIndex + 1)
      if (FILTER_KEYS.includes(key as keyof SearchFilters) && value) {
        const filterKey = key as keyof SearchFilters
        const existing = filters[filterKey] ?? []
        if (!existing.includes(value)) {
          filters[filterKey] = [...existing, value]
        }
      }
    }
  }

  return filters
}

function filtersToSearchText(filters: SearchFilters): string {
  const parts: string[] = []
  for (const key of FILTER_KEYS) {
    const values = filters[key]
    if (values) {
      for (const v of values) {
        parts.push(`${key}:${v}`)
      }
    }
  }
  return parts.join(' ')
}

export function SearchBar({ filters, onFiltersChange, className }: SearchBarProps) {
  const [inputValue, setInputValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        const newFilters = parseSearchInput(inputValue)
        onFiltersChange(newFilters)
      }
      if (e.key === 'Escape') {
        setInputValue('')
        onFiltersChange({})
      }
      if (e.key === 'Backspace' && inputValue === '' && hasActiveFilters) {
        // Remove last filter
        const keys = FILTER_KEYS.filter((k) => filters[k]?.length)
        if (keys.length > 0) {
          const lastKey = keys[keys.length - 1]
          const values = filters[lastKey] ?? []
          const updated = { ...filters }
          if (values.length <= 1) {
            delete updated[lastKey]
          } else {
            updated[lastKey] = values.slice(0, -1)
          }
          onFiltersChange(updated)
        }
      }
    },
    [inputValue, filters, onFiltersChange],
  )

  const handleClear = useCallback(() => {
    setInputValue('')
    onFiltersChange({})
  }, [onFiltersChange])

  const hasActiveFilters = FILTER_KEYS.some((k) => filters[k]?.length)
  const currentText = isFocused ? inputValue : filtersToSearchText(filters) || inputValue

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 text-sm',
        'focus-within:border-ring focus-within:ring-1 focus-within:ring-ring',
        className,
      )}
    >
      <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
      <input
        type="text"
        value={currentText}
        onChange={(e) => setInputValue(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        placeholder="Search... (e.g. method:GET status:200 controller:User)"
        className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
      />
      {(inputValue || hasActiveFilters) && (
        <button
          type="button"
          onClick={handleClear}
          className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
