import type { RouteState } from './types'

export function readRoute(): RouteState {
  const params = new URLSearchParams(window.location.search)
  const version = Number(params.get('version'))
  return {
    game: params.get('game'),
    version: Number.isFinite(version) && version > 0 ? version : undefined,
    mode: params.get('mode') ?? undefined,
  }
}

export function routeUrl(game: string | null, version?: number, mode?: string) {
  if (!game) return window.location.pathname
  let query = `?game=${game}`
  if (version) query += `&version=${version}`
  if (mode) query += `&mode=${encodeURIComponent(mode)}`
  return window.location.pathname + query
}
