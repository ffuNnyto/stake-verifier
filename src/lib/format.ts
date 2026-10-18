import type { Payout } from './types'

export const fmt = (value: number, digits = 2) => value.toLocaleString('en', { maximumFractionDigits: digits })

export function downloadCsv(filename: string, rows: Payout[]) {
  const csv = 'nonce,payout_multiplier\n' + rows.map((row) => `${row.nonce},${row.value}`).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
