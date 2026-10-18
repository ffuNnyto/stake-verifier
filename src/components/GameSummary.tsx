import { Play } from 'lucide-react'
import GameImage from '@/components/GameImage'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { fmt } from '@/lib/format'
import type { Game, Version } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  game: Game
  version: Version
  mode: string
  replayAvailable: boolean
  onModeChange: (mode: string) => void
}

export default function GameSummary({ game, version, mode, replayAvailable, onModeChange }: Props) {
  return (
    <Card className="overflow-hidden py-0">
      <GameImage src={game.game.image} name={game.game.name} width={480} className="aspect-[3/4] w-full" />
      <CardContent className="space-y-4 p-4">
        <div>
          <h1 className="text-2xl font-bold leading-tight">{game.game.name}</h1>
          <p className="text-sm text-muted-foreground">{game.publisher.name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>v{version.version}</Badge>
          {version.active && <Badge variant="secondary">Active</Badge>}
          <Badge variant="outline">{version.modes.length} modes</Badge>
        </div>
        {replayAvailable ? (
          <Badge className="gap-1.5">
            <Play className="size-3" />
            Replays available
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            Replays not yet
          </Badge>
        )}
        <div className="space-y-1">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Modes · RTP</div>
          {version.modes.map((m) => (
            <button
              key={m.name}
              type="button"
              onClick={() => onModeChange(m.name)}
              className={cn(
                'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition hover:bg-accent',
                m.name === mode && 'bg-accent font-semibold text-primary',
              )}
            >
              <span className="truncate">{m.name}</span>
              <span className="tabular-nums text-muted-foreground">{fmt(m.rtp * 100)}%</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
