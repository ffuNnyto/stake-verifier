import { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipContentProps } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer } from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import { fmt } from '@/lib/format'
import { decimateSeries } from '@/lib/series'
import type { SeriesPoint } from '@/lib/types'
import { cn } from '@/lib/utils'

const config = {
  profit: { label: 'Profit', color: 'var(--primary)' },
} satisfies ChartConfig

function PointTooltip({ active, payload }: TooltipContentProps) {
  const point = payload?.[0]?.payload as SeriesPoint | undefined
  if (!active || !point) return null

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-xl">
      <div className="text-xs text-muted-foreground">Nonce {point.nonce}</div>
      <div className={cn('text-lg font-bold tabular-nums', point.payout > 0 ? 'text-primary' : 'text-muted-foreground')}>
        {fmt(point.payout)}x
      </div>
      <div className="text-xs text-muted-foreground tabular-nums">Balance {fmt(point.profit)}x</div>
    </div>
  )
}

interface Props {
  series: SeriesPoint[]
}

export default function ProfitChart({ series }: Props) {
  const data = useMemo(() => decimateSeries(series), [series])
  const sampled = data.length < series.length

  return (
    <Card>
      <CardHeader>
        <CardTitle>Balance over time</CardTitle>
        <CardDescription>
          {sampled
            ? `Showing ${fmt(data.length, 0)} of ${fmt(series.length, 0)} nonces: the highest and lowest balance of each interval. Hover a point to see its payout.`
            : 'One point per nonce. Hover a point to see its payout multiplier and your running balance.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-96 w-full">
          <AreaChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
            <defs>
              <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-profit)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--color-profit)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="nonce"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => fmt(v, 0)}
              minTickGap={40}
            />
            <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(v: number) => fmt(v, 0)} />
            <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
            <Tooltip content={PointTooltip} cursor={{ stroke: 'var(--muted-foreground)', strokeDasharray: '3 3' }} isAnimationActive={false} />
            <Area
              dataKey="profit"
              type="linear"
              stroke="var(--color-profit)"
              strokeWidth={1.5}
              fill="url(#profitFill)"
              dot={false}
              activeDot={{ r: 5, fill: 'var(--color-profit)', stroke: 'var(--background)', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
