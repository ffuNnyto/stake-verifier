import { KNOWN_REPLAYS } from './knownReplays'

export interface ReplayConfig {
  frontendUrl: string
  uuid: string
  params: Record<string, string>
}

export function getReplayConfig(gameKey: string): ReplayConfig | null {
  return KNOWN_REPLAYS[gameKey] ?? null
}

export function hasReplay(gameKey: string) {
  return gameKey in KNOWN_REPLAYS
}

export function buildReplayUrl(config: ReplayConfig, version: number, mode: string, event: number) {
  const url = new URL(config.frontendUrl)
  url.searchParams.set('replay', 'true')
  url.searchParams.set('game', config.uuid)
  url.searchParams.set('version', String(version))
  url.searchParams.set('mode', mode)
  url.searchParams.set('event', String(event))
  for (const [key, value] of Object.entries(config.params)) url.searchParams.set(key, value)
  return url.toString()
}
