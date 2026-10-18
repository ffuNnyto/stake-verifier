export interface Mode {
  name: string
  rtp: number
  weight_range: number
  events: number
}

export interface Version {
  version: number
  active: boolean
  modes: Mode[]
}

export interface Game {
  game: { name: string; slug: string; image?: string }
  publisher: { name: string; slug: string }
  versions: Version[]
}

export interface Payout {
  nonce: number
  value: number
}

export interface PeekResponse {
  game: { modeCost: number; modeRTP: number }
  payouts: Payout[]
}

export interface PeekParams {
  team: string
  game: string
  version: number
  mode: string
  serverSeed: string
  clientSeed: string
}

export interface SeriesPoint {
  nonce: number
  payout: number
  profit: number
}

export interface RunResult {
  bets: number
  cost: number
  totalReturned: number
  runRtp: number
  expectedRtp: number
  wins: Payout[]
  best: Payout
  series: SeriesPoint[]
}

export interface ReplayRequest {
  nonce: number
  serverSeed: string
  clientSeed: string
  version: number
  mode: string
}

export interface RouteState {
  game: string | null
  version?: number
  mode?: string
}
