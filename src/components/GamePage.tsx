import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import GameSummary from '@/components/GameSummary'
import ReplayDialog from '@/components/ReplayDialog'
import Verifier from '@/components/Verifier'
import { Button } from '@/components/ui/button'
import { gameKey, sortedVersions } from '@/lib/catalog'
import { hasReplay } from '@/lib/replay'
import type { Game, ReplayRequest } from '@/lib/types'

interface Props {
  game: Game
  initialVersion?: number
  initialMode?: string
  onBack: () => void
  onSelectionChange: (version: number, mode: string) => void
}

export default function GamePage({ game, initialVersion, initialMode, onBack, onSelectionChange }: Props) {
  const versions = useMemo(() => sortedVersions(game), [game])
  const [versionNumber, setVersionNumber] = useState(() =>
    versions.some((v) => v.version === initialVersion) ? (initialVersion as number) : versions[0].version,
  )
  const version = versions.find((v) => v.version === versionNumber) ?? versions[0]
  const [mode, setMode] = useState(() =>
    version.modes.some((m) => m.name === initialMode) ? (initialMode as string) : version.modes[0].name,
  )
  const [replay, setReplay] = useState<ReplayRequest | null>(null)
  const replayAvailable = hasReplay(gameKey(game))

  useEffect(() => {
    onSelectionChange(version.version, mode)
  }, [version.version, mode, onSelectionChange])

  function changeVersion(next: number) {
    const target = versions.find((v) => v.version === next) ?? versions[0]
    setVersionNumber(target.version)
    if (!target.modes.some((m) => m.name === mode)) setMode(target.modes[0].name)
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="size-4" />
        All games
      </Button>
      <div className="grid gap-6 lg:grid-cols-[340px_1fr] xl:gap-8">
        <div className="lg:sticky lg:top-20 lg:self-start">
          <GameSummary game={game} version={version} mode={mode} replayAvailable={replayAvailable} onModeChange={setMode} />
        </div>
        <Verifier
          game={game}
          versions={versions}
          version={version.version}
          mode={mode}
          onVersionChange={changeVersion}
          onModeChange={setMode}
          onReplay={replayAvailable ? setReplay : undefined}
        />
      </div>
      <ReplayDialog game={game} request={replay} onClose={() => setReplay(null)} />
    </div>
  )
}
