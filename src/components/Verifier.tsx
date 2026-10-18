import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { AlertCircle, Dices, ShieldCheck, X } from 'lucide-react'
import Results from '@/components/Results'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSha256 } from '@/hooks/useSha256'
import { verifyRange } from '@/lib/api'
import { MAX_BETS } from '@/lib/constants'
import { fmt } from '@/lib/format'
import { randomClientSeed, randomServerSeed } from '@/lib/random'
import type { Game, RunResult, Version } from '@/lib/types'

interface Props {
  game: Game
  versions: Version[]
  version: number
  mode: string
  onVersionChange: (version: number) => void
  onModeChange: (mode: string) => void
}

export default function Verifier({ game, versions, version, mode, onVersionChange, onModeChange }: Props) {
  const modes = versions.find((v) => v.version === version)?.modes ?? []

  const [serverSeed, setServerSeed] = useState('')
  const [clientSeed, setClientSeed] = useState('')
  const [first, setFirst] = useState(1)
  const [count, setCount] = useState(100)

  const [running, setRunning] = useState(false)
  const [percent, setPercent] = useState(0)
  const [error, setError] = useState('')
  const [result, setResult] = useState<RunResult | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const [simulated, setSimulated] = useState(false)
  const hash = useSha256(serverSeed.trim())

  useEffect(() => () => abortRef.current?.abort(), [])

  function randomize() {
    setServerSeed(randomServerSeed())
    setClientSeed(randomClientSeed())
    setSimulated(true)
  }

  async function run(e: FormEvent) {
    e.preventDefault()
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setRunning(true)
    setError('')
    setResult(null)
    setPercent(0)
    try {
      const res = await verifyRange(
        {
          team: game.publisher.slug,
          game: game.game.slug,
          version,
          mode,
          serverSeed: serverSeed.trim(),
          clientSeed: clientSeed.trim(),
        },
        first,
        count,
        (done, total) => setPercent((done / total) * 100),
        controller.signal,
      )
      setResult(res)
    } catch (err) {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Check your bets</CardTitle>
          <CardDescription>
            Rotate your seed pair on Stake to reveal the server seed, then paste both seeds and the nonce range.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={run} autoComplete="off" className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Math version</Label>
              <Select value={String(version)} onValueChange={(v) => onVersionChange(Number(v))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {versions.map((v) => (
                    <SelectItem key={v.version} value={String(v.version)}>
                      v{v.version}
                      {v.active ? ' (active)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mode</Label>
              <Select value={mode} onValueChange={onModeChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {modes.map((m) => (
                    <SelectItem key={m.name} value={m.name}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between gap-3 sm:col-span-2">
              <span className="text-sm text-muted-foreground">
                {simulated ? 'Random seeds: this is a simulation, it will not match your real bets.' : 'Use your real seeds, or generate random ones to simulate a run.'}
              </span>
              <Button type="button" variant="outline" size="sm" onClick={randomize}>
                <Dices className="size-4" />
                Random seeds
              </Button>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="server">Server seed (revealed)</Label>
              <Input
                id="server"
                required
                spellCheck={false}
                value={serverSeed}
                onChange={(e) => {
                  setServerSeed(e.target.value)
                  setSimulated(false)
                }}
                className="font-mono"
              />
              <p className="break-all text-xs text-muted-foreground">
                SHA-256 to compare with the hash Stake showed before you bet: <span className="font-mono">{hash || '—'}</span>
              </p>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="client">Client seed</Label>
              <Input
                id="client"
                required
                spellCheck={false}
                value={clientSeed}
                onChange={(e) => {
                  setClientSeed(e.target.value)
                  setSimulated(false)
                }}
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="first">First nonce</Label>
              <Input
                id="first"
                type="number"
                min={0}
                required
                value={first}
                onChange={(e) => setFirst(Math.max(0, Math.floor(Number(e.target.value))))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="count">Number of bets (max {fmt(MAX_BETS, 0)})</Label>
              <Input
                id="count"
                type="number"
                min={1}
                max={MAX_BETS}
                required
                value={count}
                onChange={(e) => setCount(Math.min(MAX_BETS, Math.max(1, Math.floor(Number(e.target.value)))))}
              />
            </div>

            <div className="flex gap-3 sm:col-span-2">
              <Button type="submit" size="lg" disabled={running} className="flex-1">
                <ShieldCheck className="size-5" />
                {running ? 'Verifying…' : 'Verify'}
              </Button>
              {running && (
                <Button type="button" size="lg" variant="secondary" onClick={() => abortRef.current?.abort()}>
                  <X className="size-5" />
                  Cancel
                </Button>
              )}
            </div>

            {running && <Progress value={percent} className="sm:col-span-2" />}
            {error && (
              <Alert variant="destructive" className="sm:col-span-2">
                <AlertCircle className="size-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
      </Card>

      {result && <Results result={result} filename={`${game.game.slug}-${mode}-wins.csv`} />}
    </div>
  )
}
