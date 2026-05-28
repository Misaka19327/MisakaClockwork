import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'

interface CounterCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  className?: string
  onClick?: () => void
}

export function CounterCard({ label, value, icon, className, onClick }: CounterCardProps) {
  return (
    <Card
      className={cn(
        'transition-colors duration-150',
        onClick && 'cursor-pointer hover:bg-accent/60',
        className,
      )}
      onClick={onClick}
    >
      <CardContent className="flex flex-col items-center justify-center p-3 text-center">
        {icon && <div className="mb-1 text-muted-foreground">{icon}</div>}
        <div className="text-lg font-semibold tabular-nums">{value}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  )
}
