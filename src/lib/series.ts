import type { SeriesPoint } from './types'

export function decimateSeries(series: SeriesPoint[], maxPoints = 4000): SeriesPoint[] {
  if (series.length <= maxPoints) return series

  const bucketSize = Math.ceil(series.length / (maxPoints / 2))
  const out: SeriesPoint[] = []

  for (let start = 0; start < series.length; start += bucketSize) {
    const end = Math.min(start + bucketSize, series.length)
    let low = series[start]
    let high = series[start]
    for (let i = start + 1; i < end; i++) {
      const point = series[i]
      if (point.profit < low.profit) low = point
      if (point.profit > high.profit) high = point
    }
    if (low === high) out.push(low)
    else if (low.nonce < high.nonce) out.push(low, high)
    else out.push(high, low)
  }

  return out
}

export function sliceByNonce(series: SeriesPoint[], from: number, to: number): SeriesPoint[] {
  let low = 0
  let high = series.length
  while (low < high) {
    const mid = (low + high) >> 1
    if (series[mid].nonce < from) low = mid + 1
    else high = mid
  }
  const start = Math.max(0, low - 1)

  low = start
  high = series.length
  while (low < high) {
    const mid = (low + high) >> 1
    if (series[mid].nonce <= to) low = mid + 1
    else high = mid
  }
  const end = Math.min(series.length, low + 1)

  return series.slice(start, end)
}
