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
