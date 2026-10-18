import { normalizeCatalogue } from './catalog'
import { FAIR_API, MAX_PER_REQUEST } from './constants'
import type { Game, Payout, PeekParams, PeekResponse, RunResult, SeriesPoint } from './types'

export async function fetchCatalogue(signal?: AbortSignal): Promise<Game[]> {
  const res = await fetch(`${FAIR_API}/catalogue`, { signal })
  if (!res.ok) throw new Error(`Could not load the game list (HTTP ${res.status}).`)
  return normalizeCatalogue((await res.json()) as Game[])
}

async function peek(params: PeekParams, from: number, to: number, signal?: AbortSignal): Promise<PeekResponse> {
  const res = await fetch(`${FAIR_API}/peek`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    signal,
    body: JSON.stringify({
      team: params.team,
      game: params.game,
      version: params.version,
      mode: params.mode,
      serverSeed: params.serverSeed,
      clientSeed: params.clientSeed,
      nonceStart: from,
      nonceEnd: to,
    }),
  })
  if (!res.ok) {
    throw new Error(`The fair service rejected the request (HTTP ${res.status}). Check the seeds, mode and range.`)
  }
  return res.json()
}

export async function verifyRange(
  params: PeekParams,
  first: number,
  count: number,
  onProgress: (done: number, total: number) => void,
  signal?: AbortSignal,
): Promise<RunResult> {
  const wins: Payout[] = []
  const series: SeriesPoint[] = []
  let sum = 0
  let profit = 0
  let bets = 0
  let cost = 1
  let expectedRtp = Number.NaN
  let best: Payout = { nonce: 0, value: 0 }

  for (let from = first; from < first + count; from += MAX_PER_REQUEST) {
    const to = Math.min(from + MAX_PER_REQUEST, first + count)
    const data = await peek(params, from, to, signal)
    cost = data.game.modeCost
    expectedRtp = data.game.modeRTP
    for (const item of data.payouts) {
      bets++
      sum += item.value
      profit += item.value - cost
      if (item.value > 0) wins.push(item)
      if (item.value > best.value) best = item
      series.push({ nonce: item.nonce, payout: item.value, profit })
    }
    onProgress(bets, count)
  }

  return {
    bets,
    cost,
    totalReturned: sum,
    runRtp: bets > 0 ? sum / (bets * cost) : 0,
    expectedRtp,
    wins,
    best,
    series,
  }
}
