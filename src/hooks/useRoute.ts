import { useCallback, useEffect, useRef, useState } from 'react'
import { readRoute, routeUrl } from '@/lib/route'

export function useRoute() {
  const [route, setRoute] = useState(readRoute)
  const gameRef = useRef(route.game)

  useEffect(() => {
    gameRef.current = route.game
  }, [route.game])

  useEffect(() => {
    const onPop = () => setRoute(readRoute())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const openGame = useCallback((game: string) => {
    window.history.pushState(null, '', routeUrl(game))
    setRoute({ game })
  }, [])

  const goHome = useCallback(() => {
    window.history.pushState(null, '', routeUrl(null))
    setRoute({ game: null })
  }, [])

  const syncSelection = useCallback((version: number, mode: string) => {
    if (gameRef.current) window.history.replaceState(null, '', routeUrl(gameRef.current, version, mode))
  }, [])

  return { route, openGame, goHome, syncSelection }
}
