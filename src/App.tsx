import { useMemo } from 'react'
import GamePage from '@/components/GamePage'
import GameGrid from '@/components/GameGrid'
import Header from '@/components/Header'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useCatalogue } from '@/hooks/useCatalogue'
import { useRoute } from '@/hooks/useRoute'
import { gameKey } from '@/lib/catalog'

export default function App() {
  const { games, error } = useCatalogue()
  const { route, openGame, goHome, syncSelection } = useRoute()

  const selected = useMemo(
    () => (games && route.game ? (games.find((g) => gameKey(g) === route.game) ?? null) : null),
    [games, route.game],
  )

  let content
  if (error) {
    content = (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  } else if (selected) {
    content = (
      <GamePage
        key={route.game}
        game={selected}
        initialVersion={route.version}
        initialMode={route.mode}
        onBack={goHome}
        onSelectionChange={syncSelection}
      />
    )
  } else if (route.game && !games) {
    content = <p className="py-20 text-center text-muted-foreground">Loading game…</p>
  } else {
    content = (
      <>
        {route.game && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>Game “{route.game}” was not found.</AlertDescription>
          </Alert>
        )}
        <GameGrid games={games} onOpen={(game) => openGame(gameKey(game))} />
      </>
    )
  }

  return (
    <div className="min-h-screen">
      <Header onHome={goHome} />
      <main className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6">{content}</main>
      <footer className="mx-auto max-w-[1500px] px-4 py-8 text-center text-xs text-muted-foreground">
        Not affiliated with Stake or Engine. Results come from fair.stake-engine.com. Your seeds are only sent to that service.
      </footer>
    </div>
  )
}
