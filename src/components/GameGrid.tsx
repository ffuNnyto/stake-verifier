import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import GameCard from '@/components/GameCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { countPublishers } from '@/lib/catalog'
import { fmt } from '@/lib/format'
import type { Game } from '@/lib/types'

const PAGE = 30

interface Props {
  games: Game[] | null
  onOpen: (game: Game) => void
}

export default function GameGrid({ games, onOpen }: Props) {
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(PAGE)

  const index = useMemo(
    () => (games ?? []).map((game) => ({ game, text: `${game.game.name} ${game.publisher.name}`.toLowerCase() })),
    [games],
  )
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? index.filter((item) => item.text.includes(q)) : index
  }, [index, query])

  return (
    <section>
      <div className="mx-auto max-w-2xl py-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Verify your <span className="text-primary">Stake Engine</span> bets
        </h1>
        <p className="mt-3 text-muted-foreground">
          Pick a game, paste your revealed server seed and client seed, and check every spin against the official fair service.
        </p>
        <div className="relative mt-6">
          <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            type="search"
            autoComplete="off"
            placeholder="Search a game or publisher"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setLimit(PAGE)
            }}
            className="h-12 pl-10 text-base"
          />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {games
            ? `${fmt(matches.length, 0)} of ${fmt(games.length, 0)} games · ${fmt(countPublishers(games), 0)} publishers`
            : 'Loading games…'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {games
          ? matches.slice(0, limit).map(({ game }) => <GameCard key={`${game.publisher.slug}/${game.game.slug}`} game={game} onOpen={onOpen} />)
          : Array.from({ length: 10 }, (_, i) => <Skeleton key={i} className="aspect-[3/4] w-full rounded-xl" />)}
      </div>

      {games && matches.length === 0 && <p className="py-16 text-center text-muted-foreground">No games match your search.</p>}

      {matches.length > limit && (
        <div className="flex justify-center py-8">
          <Button variant="secondary" size="lg" onClick={() => setLimit((l) => l + PAGE)}>
            Show more
          </Button>
        </div>
      )}
    </section>
  )
}
