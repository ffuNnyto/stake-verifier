import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface Props {
  icon: LucideIcon
  label: string
  value: string
  hint?: string
  accent?: boolean
}

export default function StatCard({ icon: Icon, label, value, hint, accent }: Props) {
  return (
    <Card className="gap-2 py-4">
      <CardContent className="px-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon className="size-4" />
          {label}
        </div>
        <div className={cn('mt-1 text-2xl font-bold tabular-nums', accent && 'text-primary')}>{value}</div>
        {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  )
}
