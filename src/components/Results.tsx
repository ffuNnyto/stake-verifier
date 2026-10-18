import { lazy, Suspense } from 'react'
import { Download, Percent, Play, Receipt, Target, Trophy } from 'lucide-react'
import StatCard from '@/components/StatCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { downloadCsv, fmt } from '@/lib/format'
import type { RunResult } from '@/lib/types'

const ProfitChart = lazy(() => import('@/components/ProfitChart'))

const MAX_ROWS = 300

interface Props {
  result: RunResult
  filename: string
  onReplay?: (nonce: number) => void
}

export default function Results({ result, filename, onReplay }: Props) {
  const { bets, wins, best, runRtp, expectedRtp, totalReturned, cost } = result
  const hasExpected = Number.isFinite(expectedRtp)
  const delta = hasExpected ? (runRtp - expectedRtp) * 100 : 0

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Receipt} label="Bets checked" value={fmt(bets, 0)} hint={`${fmt(cost)}x cost per bet`} />
        <StatCard
          icon={Percent}
          label="Run RTP"
          value={`${fmt(runRtp * 100)}%`}
          hint={hasExpected ? `${fmt(expectedRtp * 100)}% expected (${delta >= 0 ? '+' : ''}${fmt(delta)} pts)` : undefined}
          accent={hasExpected && delta >= 0}
        />
        <StatCard icon={Target} label="Winning bets" value={fmt(wins.length, 0)} hint={`${fmt((wins.length / bets) * 100)}% hit rate`} />
        <StatCard
          icon={Trophy}
          label="Biggest win"
          value={best.value ? `${fmt(best.value)}x` : 'None'}
          hint={best.value ? `Nonce ${best.nonce} · ${fmt(totalReturned)}x returned` : `${fmt(totalReturned)}x returned`}
        />
      </div>

      <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
        <ProfitChart series={result.series} onPickNonce={onReplay} />
      </Suspense>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle>Winning bets</CardTitle>
          <div className="flex gap-2">
            {onReplay && best.value > 0 && (
              <Button variant="secondary" size="sm" onClick={() => onReplay(best.nonce)}>
                <Play className="size-4" />
                Replay biggest win
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => downloadCsv(filename, wins)} disabled={wins.length === 0}>
              <Download className="size-4" />
              CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {wins.length === 0 ? (
            <p className="text-sm text-muted-foreground">No winning bets in this range.</p>
          ) : (
            <div className="max-h-96 overflow-y-auto rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead>Nonce</TableHead>
                    <TableHead className="text-right">Payout</TableHead>
                    {onReplay && <TableHead className="w-20 text-right">Replay</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wins.slice(0, MAX_ROWS).map((win) => (
                    <TableRow key={win.nonce}>
                      <TableCell className="tabular-nums">{win.nonce}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{fmt(win.value)}x</TableCell>
                      {onReplay && (
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onClick={() => onReplay(win.nonce)}
                            aria-label={`Replay nonce ${win.nonce}`}
                          >
                            <Play className="size-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {wins.length > MAX_ROWS && (
            <p className="mt-3 text-xs text-muted-foreground">
              Showing the first {MAX_ROWS} of {fmt(wins.length, 0)}. Download the CSV for the rest.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
