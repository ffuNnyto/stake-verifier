import GameImage from '@/components/GameImage'
import type { Game } from '@/lib/types'

interface Props {
  game: Game
  onOpen: (game: Game) => void
}

export default function GameCard({ game, onOpen }: Props) {
  return (
    <button
      type="button"
      onClick={() => onOpen(game)}
      className="group relative overflow-hidden rounded-xl border bg-card text-left transition hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10 focus-visible:outline-2 focus-visible:outline-primary"
    >
      <GameImage src={game.game.image} name={game.game.name} className="aspect-[3/4] w-full transition duration-300 group-hover:scale-105" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 pt-10">
        <div className="truncate text-sm font-semibold text-white">{game.game.name}</div>
        <div className="truncate text-xs text-white/70">{game.publisher.name}</div>
      </div>
    </button>
  )
}
