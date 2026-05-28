import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CounterCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  className?: string
  onClick?: () => void
}

export function CounterCard({ label, value, icon, className, onClick }: CounterCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-border/50 bg-card/50 p-3 text-center transition-colors duration-150',
        onClick && 'cursor-pointer hover:bg-accent/60',
        !onClick && 'cursor-default',
        className,
      )}
    >
      {icon && <div className="mb-1 text-muted-foreground">{icon}</div>}
      <div className="text-lg font-semibold tabular-nums text-card-foreground">{value}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
    </button>
  )
}
