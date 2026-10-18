import { EXCLUDED_PUBLISHERS, FEATURED_PUBLISHERS } from './constants'
import type { Game, Version } from './types'

export function gameKey(game: Game) {
  return `${game.publisher.slug}/${game.game.slug}`
}

function featuredRank(game: Game) {
  const index = FEATURED_PUBLISHERS.indexOf(game.publisher.slug)
  return index === -1 ? FEATURED_PUBLISHERS.length : index
}

export function normalizeCatalogue(raw: Game[]): Game[] {
  const seen = new Set<string>()
  const games = raw.filter((game) => {
    const key = gameKey(game)
    if (seen.has(key) || game.versions.length === 0 || EXCLUDED_PUBLISHERS.has(game.publisher.slug)) return false
    seen.add(key)
    return true
  })
  return games.sort((a, b) => featuredRank(a) - featuredRank(b) || a.game.name.localeCompare(b.game.name))
}

export function sortedVersions(game: Game): Version[] {
  return [...game.versions].sort((a, b) => Number(b.active) - Number(a.active) || b.version - a.version)
}

export function countPublishers(games: Game[]) {
  return new Set(games.map((game) => game.publisher.slug)).size
}
