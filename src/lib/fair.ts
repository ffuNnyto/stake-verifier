import { FAIR_API } from './constants'

export interface ModeRef {
  team: string
  game: string
  version: number
  mode: string
}

export interface OutcomeRow {
  nonce: number
  roll: bigint
  payout: number
}

export interface EventRange {
  event: number
  start: bigint
  end: bigint
  payout: number
}

export interface ReplayLookup {
  nonce: number
  roll: bigint
  event: EventRange
}

const PROBES = 16
const DIRECT = 64

const modePath = (ref: ModeRef) =>
  `${encodeURIComponent(ref.team)}/${encodeURIComponent(ref.game)}/${ref.version}/${encodeURIComponent(ref.mode)}`

const bigNumbers = (text: string) => text.replace(/"(roll|start|end)":\s*(\d+)/g, '"$1":"$2"')

async function readJson<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`The fair service rejected the request (HTTP ${res.status}).`)
  return JSON.parse(bigNumbers(await res.text())) as T
}

export async function fetchOutcome(
  ref: ModeRef,
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  signal?: AbortSignal,
): Promise<OutcomeRow> {
  const res = await fetch(`${FAIR_API}/outcome/${modePath(ref)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    signal,
    body: JSON.stringify({ clientSeed, serverSeed, nonceStart: nonce, nonceEnd: nonce + 1 }),
  })
  const rows = await readJson<{ nonce: number; roll: string; payout: number }[]>(res)
  const row = rows[0]
  if (!row) throw new Error('The fair service returned no outcome for that nonce.')
  return { nonce: row.nonce, roll: BigInt(row.roll), payout: row.payout }
}

export async function fetchEvents(ref: ModeRef, from: number, to: number, signal?: AbortSignal): Promise<EventRange[]> {
  const res = await fetch(`${FAIR_API}/event/${modePath(ref)}?from=${from}&to=${to}`, { signal })
  const rows = await readJson<{ event: number; start: string; end: string; payout: number }[]>(res)
  return rows.map((row) => ({ event: row.event, start: BigInt(row.start), end: BigInt(row.end), payout: row.payout }))
}

const contains = (range: EventRange, roll: bigint) => roll >= range.start && roll < range.end

export async function findEvent(ref: ModeRef, roll: bigint, total: number, signal?: AbortSignal): Promise<EventRange> {
  let low = 0
  let high = total - 1

  while (high - low + 1 > DIRECT) {
    const size = high - low + 1
    const points = Array.from({ length: PROBES }, (_, i) => low + Math.floor((size * (i + 1)) / (PROBES + 1)))
    const probed = await Promise.all(points.map((point) => fetchEvents(ref, point, point, signal)))

    let nextLow = low
    let nextHigh = high
    for (let i = 0; i < points.length; i++) {
      const range = probed[i][0]
      if (!range) throw new Error('The fair service returned an incomplete event table.')
      if (contains(range, roll)) return range
      if (roll >= range.end) nextLow = Math.max(nextLow, points[i] + 1)
      else nextHigh = Math.min(nextHigh, points[i] - 1)
    }
    if (nextLow > nextHigh) throw new Error('Could not locate the event for this roll.')
    low = nextLow
    high = nextHigh
  }

  const rows = await fetchEvents(ref, low, high, signal)
  const found = rows.find((range) => contains(range, roll))
  if (!found) throw new Error('Could not locate the event for this roll.')
  return found
}

export async function lookupReplayEvent(
  ref: ModeRef,
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  totalEvents: number,
  signal?: AbortSignal,
): Promise<ReplayLookup> {
  const outcome = await fetchOutcome(ref, serverSeed, clientSeed, nonce, signal)
  const event = await findEvent(ref, outcome.roll, totalEvents, signal)
  return { nonce, roll: outcome.roll, event }
}
