import { useEffect, useMemo, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { Area, AreaChart, CartesianGrid, ReferenceDot, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipContentProps } from 'recharts'
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer } from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import { fmt, fmtCompact } from '@/lib/format'
import { decimateSeries, sliceByNonce } from '@/lib/series'
import type { SeriesPoint } from '@/lib/types'
import { cn } from '@/lib/utils'

const config = {
  profit: { label: 'Profit', color: 'var(--primary)' },
  max: { label: 'Max win', color: 'oklch(0.85 0.17 90)' },
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

const MAX_MARKERS = 500
const STAR_HIT_RADIUS = 12
const DRAG_THRESHOLD = 6

const STAR_POINTS = Array.from({ length: 10 }, (_, i) => {
  const radius = i % 2 === 0 ? 8 : 3.4
  const angle = (Math.PI / 5) * i - Math.PI / 2
  return `${(Math.cos(angle) * radius).toFixed(2)},${(Math.sin(angle) * radius).toFixed(2)}`
}).join(' ')

interface StarMarkerProps {
  cx: number
  cy: number
  label: string
  clickable: boolean
}

function StarMarker({ cx, cy, label, clickable }: StarMarkerProps) {
  return (
    <g transform={`translate(${cx},${cy})`} style={{ cursor: clickable ? 'pointer' : 'default' }}>
      <title>{label}</title>
      <polygon points={STAR_POINTS} fill="var(--color-max)" stroke="var(--background)" strokeWidth={1} />
    </g>
  )
}

type Range = [number, number]

interface DragBox {
  left: number
  right: number
  offsetLeft: number
  offsetTop: number
  height: number
}

interface Drag {
  startX: number
  currentX: number
  box: DragBox
}

interface Props {
  series: SeriesPoint[]
  markers: SeriesPoint[]
  sampledEvery: number
  onPickNonce?: (nonce: number) => void
}

export default function ProfitChart({ series, markers, sampledEvery, onPickNonce }: Props) {
  const plotRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<Drag | null>(null)
  const justDragged = useRef(false)
  const [zoom, setZoom] = useState<{ for: SeriesPoint[]; range: Range } | null>(null)
  const [drag, setDrag] = useState<Drag | null>(null)
  const dragging = drag !== null

  const range = zoom && zoom.for === series ? zoom.range : null

  const full = useMemo<Range>(() => {
    let min = Number.POSITIVE_INFINITY
    let max = Number.NEGATIVE_INFINITY
    for (const point of [series[0], series[series.length - 1], ...markers]) {
      if (!point) continue
      if (point.nonce < min) min = point.nonce
      if (point.nonce > max) max = point.nonce
    }
    return [min, max]
  }, [series, markers])

  const minSpan = useMemo(() => {
    const spacing = series.length > 1 ? (full[1] - full[0]) / (series.length - 1) : 1
    return Math.max(spacing * 5, 10)
  }, [series, full])

  const visibleSeries = useMemo(() => (range ? sliceByNonce(series, range[0], range[1]) : series), [series, range])
  const data = useMemo(() => decimateSeries(visibleSeries), [visibleSeries])
  const shownMarkers = useMemo(
    () => (range ? markers.filter((m) => m.nonce >= range[0] && m.nonce <= range[1]) : markers).slice(0, MAX_MARKERS),
    [markers, range],
  )

  const bounds = useMemo(() => {
    const x: Range = range ?? full
    let minY = Number.POSITIVE_INFINITY
    let maxY = Number.NEGATIVE_INFINITY
    for (const point of [...data, ...shownMarkers]) {
      if (point.nonce < x[0] || point.nonce > x[1]) continue
      if (point.profit < minY) minY = point.profit
      if (point.profit > maxY) maxY = point.profit
    }
    if (!Number.isFinite(minY)) return { x, y: [0, 1] as Range }
    if (!range) return { x, y: [Math.min(minY, 0), Math.max(maxY, 0)] as Range }
    const pad = (maxY - minY) * 0.06 || 1
    return { x, y: [minY - pad, maxY + pad] as Range }
  }, [range, full, data, shownMarkers])

  const zoomed = range !== null
  const sampled = sampledEvery > 1 || visibleSeries.length > data.length
  const replayHint = onPickNonce ? ', click it to watch the replay' : ''

  function applyRange(next: Range) {
    const center = (next[0] + next[1]) / 2
    const span = Math.max(next[1] - next[0], minSpan)
    let low = center - span / 2
    let high = center + span / 2
    if (low <= full[0] && high >= full[1]) {
      setZoom(null)
      return
    }
    if (low < full[0]) {
      high += full[0] - low
      low = full[0]
    }
    if (high > full[1]) {
      low -= high - full[1]
      high = full[1]
    }
    setZoom({ for: series, range: [Math.max(full[0], Math.round(low)), Math.min(full[1], Math.round(high))] })
  }

  function zoomBy(factor: number) {
    const [low, high] = range ?? full
    const center = (low + high) / 2
    const half = ((high - low) / 2) * factor
    applyRange([center - half, center + half])
  }

  function plotRect() {
    return plotRef.current?.querySelector('.recharts-cartesian-grid')?.getBoundingClientRect()
  }

  const latest = useRef({ bounds, applyRange })
  useEffect(() => {
    latest.current = { bounds, applyRange }
  })

  function handleMouseDown(event: MouseEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    const grid = plotRect()
    const wrapper = plotRef.current?.getBoundingClientRect()
    if (!grid || !wrapper) return
    const inside =
      event.clientX >= grid.left && event.clientX <= grid.right && event.clientY >= grid.top && event.clientY <= grid.bottom
    if (!inside) return
    const box = {
      left: grid.left,
      right: grid.right,
      offsetLeft: wrapper.left,
      offsetTop: grid.top - wrapper.top,
      height: grid.height,
    }
    const next = { startX: event.clientX, currentX: event.clientX, box }
    dragRef.current = next
    setDrag(next)
  }

  useEffect(() => {
    if (!dragging) return

    const onMove = (event: globalThis.MouseEvent) => {
      if (!dragRef.current) return
      dragRef.current = { ...dragRef.current, currentX: event.clientX }
      setDrag(dragRef.current)
    }
    const onUp = (event: globalThis.MouseEvent) => {
      const finished = dragRef.current
      dragRef.current = null
      setDrag(null)
      if (!finished || Math.abs(event.clientX - finished.startX) < DRAG_THRESHOLD) return
      justDragged.current = true
      window.setTimeout(() => {
        justDragged.current = false
      }, 0)
      const { bounds: view, applyRange: apply } = latest.current
      const width = finished.box.right - finished.box.left
      const nonceAt = (clientX: number) => {
        const ratio = width > 0 ? Math.min(1, Math.max(0, (clientX - finished.box.left) / width)) : 0
        return view.x[0] + ratio * (view.x[1] - view.x[0])
      }
      const a = nonceAt(finished.startX)
      const b = nonceAt(event.clientX)
      apply(a < b ? [a, b] : [b, a])
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragging])

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    if (justDragged.current) return
    if (!onPickNonce || data.length === 0) return
    const grid = plotRect()
    if (!grid || grid.width === 0) return
    const ratio = (event.clientX - grid.left) / grid.width
    if (ratio < 0 || ratio > 1) return

    const stars = plotRef.current?.querySelectorAll('.recharts-reference-dot') ?? []
    let nearestStar = -1
    let nearestDistance = STAR_HIT_RADIUS
    stars.forEach((star, index) => {
      const box = star.getBoundingClientRect()
      const distance = Math.hypot(event.clientX - (box.left + box.width / 2), event.clientY - (box.top + box.height / 2))
      if (distance <= nearestDistance) {
        nearestDistance = distance
        nearestStar = index
      }
    })
    if (nearestStar >= 0 && shownMarkers[nearestStar]) {
      onPickNonce(shownMarkers[nearestStar].nonce)
      return
    }

    const target = bounds.x[0] + ratio * (bounds.x[1] - bounds.x[0])
    let low = 0
    let high = data.length - 1
    while (low < high) {
      const mid = (low + high) >> 1
      if (data[mid].nonce < target) low = mid + 1
      else high = mid
    }
    const before = data[Math.max(0, low - 1)]
    const after = data[low]
    onPickNonce(Math.abs(before.nonce - target) <= Math.abs(after.nonce - target) ? before.nonce : after.nonce)
  }

  const selection =
    drag && Math.abs(drag.currentX - drag.startX) >= 2
      ? (() => {
          const left = Math.max(drag.box.left, Math.min(drag.startX, drag.currentX))
          const right = Math.min(drag.box.right, Math.max(drag.startX, drag.currentX))
          return { left: left - drag.box.offsetLeft, width: right - left, top: drag.box.offsetTop, height: drag.box.height }
        })()
      : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Balance over time</CardTitle>
        <CardDescription>
          {sampledEvery > 1
            ? `One point every ${fmt(sampledEvery, 0)} nonces. `
            : sampled
              ? `Showing ${fmt(data.length, 0)} of ${fmt(visibleSeries.length, 0)} nonces: the highest and lowest balance of each interval. `
              : 'One point per nonce. '}
          {markers.length > 0
            ? `Gold stars are max wins${markers.length > MAX_MARKERS ? ` (first ${MAX_MARKERS} shown)` : ''}${replayHint}. `
            : `Hover a point to see its payout${replayHint}. `}
          Drag over the chart to zoom.
        </CardDescription>
        <CardAction className="flex items-center gap-1">
          {zoomed && (
            <span className="mr-1 hidden text-xs tabular-nums text-muted-foreground sm:inline">
              {fmt(bounds.x[0], 0)} – {fmt(bounds.x[1], 0)}
            </span>
          )}
          <Button variant="outline" size="icon-sm" onClick={() => zoomBy(0.5)} aria-label="Zoom in" title="Zoom in">
            <ZoomIn className="size-4" />
          </Button>
          <Button variant="outline" size="icon-sm" onClick={() => zoomBy(2)} disabled={!zoomed} aria-label="Zoom out" title="Zoom out">
            <ZoomOut className="size-4" />
          </Button>
          <Button variant="outline" size="icon-sm" onClick={() => setZoom(null)} disabled={!zoomed} aria-label="Reset zoom" title="Reset zoom">
            <RotateCcw className="size-4" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div
          ref={plotRef}
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          className={cn('relative select-none', dragging && 'cursor-crosshair')}
        >
          <ChartContainer config={config} className={cn('h-96 w-full', onPickNonce && !dragging && 'cursor-pointer')}>
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
                domain={bounds.x}
                allowDataOverflow
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => fmtCompact(v)}
                minTickGap={40}
              />
              <YAxis
                domain={bounds.y}
                allowDataOverflow
                tickLine={false}
                axisLine={false}
                width={64}
                tickFormatter={(v: number) => fmtCompact(v)}
              />
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
              {shownMarkers.map((marker) => (
                <ReferenceDot
                  key={marker.nonce}
                  x={marker.nonce}
                  y={marker.profit}
                  ifOverflow="visible"
                  shape={(props: { cx?: number; cy?: number }) => (
                    <StarMarker
                      cx={props.cx ?? 0}
                      cy={props.cy ?? 0}
                      label={`Max win · nonce ${fmt(marker.nonce, 0)} · ${fmt(marker.payout)}x`}
                      clickable={Boolean(onPickNonce)}
                    />
                  )}
                />
              ))}
            </AreaChart>
          </ChartContainer>
          {selection && (
            <div
              className="pointer-events-none absolute border-x border-primary/70 bg-primary/15"
              style={{ left: selection.left, width: selection.width, top: selection.top, height: selection.height }}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
