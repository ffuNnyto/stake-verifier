import { useEffect, useState } from 'react'
import { fetchCatalogue } from '@/lib/api'
import type { Game } from '@/lib/types'

export function useCatalogue() {
  const [games, setGames] = useState<Game[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    fetchCatalogue(controller.signal)
      .then(setGames)
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Could not load the game list.')
      })
    return () => controller.abort()
  }, [])

  return { games, error }
}
