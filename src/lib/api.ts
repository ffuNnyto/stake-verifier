import { normalizeCatalogue } from './catalog'
import { FAIR_API, MAX_PER_REQUEST, ONLY_MAX_CONCURRENCY } from './constants'
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

export interface VerifyOptions {
  onlyMax?: boolean
}

export const SAMPLE_STEP = 500

interface ChunkOutcome {
  count: number
  sum: number
  delta: number
  best: Payout
  wins: Payout[]
  points: SeriesPoint[]
  hits: SeriesPoint[]
}

function summarize(data: PeekResponse, onlyMax: boolean): ChunkOutcome {
  const { modeCost, modeMax } = data.game
  const step = onlyMax ? SAMPLE_STEP : 1
  const wins: Payout[] = []
  const points: SeriesPoint[] = []
  const hits: SeriesPoint[] = []
  let best: Payout = { nonce: 0, value: 0 }
  let sum = 0
  let profit = 0

  data.payouts.forEach((item, index) => {
    sum += item.value
    profit += item.value - modeCost
    const isMax = item.value >= modeMax
    if (isMax) hits.push({ nonce: item.nonce, payout: item.value, profit })
    if (onlyMax ? isMax : item.value > 0) wins.push(item)
    if (index % step === 0) points.push({ nonce: item.nonce, payout: item.value, profit })
    if (item.value > best.value) best = item
  })

  return { count: data.payouts.length, sum, delta: profit, best, wins, points, hits }
}

export async function verifyRange(
  params: PeekParams,
  first: number,
  count: number,
  onProgress: (done: number, total: number) => void,
  signal?: AbortSignal,
  options: VerifyOptions = {},
): Promise<RunResult> {
  const onlyMax = options.onlyMax === true

  const chunks: [number, number][] = []
  for (let from = first; from < first + count; from += MAX_PER_REQUEST) {
    chunks.push([from, Math.min(from + MAX_PER_REQUEST, first + count)])
  }

  const outcomes = new Array<ChunkOutcome>(chunks.length)
  let cost = 1
  let expectedRtp = Number.NaN
  let maxPayout = Number.POSITIVE_INFINITY
  let done = 0
  let next = 0
  let failed = false

  async function worker() {
    while (!failed && next < chunks.length) {
      const index = next++
      const [from, to] = chunks[index]
      try {
        const data = await peek(params, from, to, signal)
        cost = data.game.modeCost
        expectedRtp = data.game.modeRTP
        maxPayout = data.game.modeMax
        outcomes[index] = summarize(data, onlyMax)
        done += outcomes[index].count
        onProgress(done, count)
      } catch (err) {
        failed = true
        throw err
      }
    }
  }

  const concurrency = onlyMax ? Math.min(ONLY_MAX_CONCURRENCY, chunks.length) : 1
  await Promise.all(Array.from({ length: concurrency }, worker))

  const wins: Payout[] = []
  const series: SeriesPoint[] = []
  const markers: SeriesPoint[] = []
  let best: Payout = { nonce: 0, value: 0 }
  let bets = 0
  let sum = 0
  let offset = 0

  for (const outcome of outcomes) {
    for (const point of outcome.points) series.push({ ...point, profit: point.profit + offset })
    for (const hit of outcome.hits) markers.push({ ...hit, profit: hit.profit + offset })
    for (const win of outcome.wins) wins.push(win)
    if (outcome.best.value > best.value) best = outcome.best
    bets += outcome.count
    sum += outcome.sum
    offset += outcome.delta
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
    markers,
    onlyMax,
    maxPayout,
  }
}
