import data from './knownReplays.json'
import type { ReplayConfig } from './replay'

const defaults = {
  currency: 'USD',
  amount: '1000000',
  lang: 'en',
  device: 'desktop',
  social: 'false',
  demo: 'false',
  rgs_url: 'rgsd.engine.io',
}

interface KnownEntry {
  frontendUrl: string
  uuid: string
}

export const KNOWN_REPLAYS: Record<string, ReplayConfig> = Object.fromEntries(
  Object.entries(data as Record<string, KnownEntry>).map(([key, entry]) => [key, { ...entry, params: defaults }]),
)
