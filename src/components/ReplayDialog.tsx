import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, ExternalLink, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { gameKey } from '@/lib/catalog'
import { lookupReplayEvent } from '@/lib/fair'
import type { ReplayLookup } from '@/lib/fair'
import { fmt } from '@/lib/format'
import { buildReplayUrl, getReplayConfig } from '@/lib/replay'
import type { Game, ReplayRequest } from '@/lib/types'

interface Props {
  game: Game
  request: ReplayRequest | null
  onClose: () => void
}

interface Outcome {
  for: ReplayRequest
  lookup?: ReplayLookup
  error?: string
}

export default function ReplayDialog({ game, request, onClose }: Props) {
  const config = getReplayConfig(gameKey(game))
  const [outcome, setOutcome] = useState<Outcome | null>(null)

  const current = request && outcome?.for === request ? outcome : null
  const finding = request !== null && current === null
  const lookup = current?.lookup

  useEffect(() => {
    if (!request) return
    const controller = new AbortController()
    const events =
      game.versions.find((v) => v.version === request.version)?.modes.find((m) => m.name === request.mode)?.events ?? 0

    lookupReplayEvent(
      { team: game.publisher.slug, game: game.game.slug, version: request.version, mode: request.mode },
      request.serverSeed,
      request.clientSeed,
      request.nonce,
      events,
      controller.signal,
    )
      .then((result) => setOutcome({ for: request, lookup: result }))
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setOutcome({ for: request, error: err instanceof Error ? err.message : 'Something went wrong.' })
        }
      })

    return () => controller.abort()
  }, [request, game])

  const src = useMemo(
    () => (config && lookup && request ? buildReplayUrl(config, request.version, request.mode, lookup.event.event) : ''),
    [config, lookup, request],
  )

  return (
    <Dialog open={request !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {game.game.name} · nonce {request ? fmt(request.nonce, 0) : ''}
          </DialogTitle>
          <DialogDescription>{request ? `${request.mode} · math v${request.version}` : ''}</DialogDescription>
        </DialogHeader>

        {finding && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Finding the event…
          </div>
        )}

        {current?.error && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>{current.error}</AlertDescription>
          </Alert>
        )}

        {lookup && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="secondary">Event {fmt(lookup.event.event, 0)}</Badge>
            <Badge className={lookup.event.payout > 0 ? '' : 'bg-muted text-muted-foreground'}>
              {fmt(lookup.event.payout / 100)}x
            </Badge>
            <span className="font-mono text-xs text-muted-foreground">roll {lookup.roll.toString()}</span>
            {src && (
              <Button asChild variant="ghost" size="sm" className="ml-auto">
                <a href={src} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" />
                  New tab
                </a>
              </Button>
            )}
          </div>
        )}

        {src && (
          <iframe
            key={src}
            src={src}
            title={`${game.game.name} replay`}
            sandbox="allow-scripts allow-same-origin allow-popups"
            allow="autoplay; fullscreen"
            className="h-[60vh] min-h-[420px] w-full rounded-lg border bg-black"
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
