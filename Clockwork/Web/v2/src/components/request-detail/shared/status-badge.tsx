import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status?: number
  className?: string
}

const statusStyles: Record<string, string> = {
  '2': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  '3': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  '4': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  '5': 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  if (!status) return null

  const group = String(Math.floor(status / 100))
  const styles = statusStyles[group] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums',
        styles,
        className,
      )}
    >
      {status}
    </span>
  )
}
