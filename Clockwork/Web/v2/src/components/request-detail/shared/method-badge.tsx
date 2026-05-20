import { cn } from '@/lib/utils'

interface MethodBadgeProps {
  method?: string
  className?: string
}

const methodStyles: Record<string, string> = {
  GET: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  POST: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  PUT: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  PATCH: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  HEAD: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  OPTIONS: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
}

export function MethodBadge({ method, className }: MethodBadgeProps) {
  if (!method) return null

  const styles = methodStyles[method.toUpperCase()] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded px-1.5 py-0.5 text-xs font-bold',
        styles,
        className,
      )}
    >
      {method.toUpperCase()}
    </span>
  )
}
