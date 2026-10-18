import { useEffect, useState } from 'react'
import { sha256Hex } from '@/lib/crypto'

export function useSha256(text: string) {
  const [hashed, setHashed] = useState({ text: '', hash: '' })

  useEffect(() => {
    if (!text) return
    let stale = false
    sha256Hex(text).then((hash) => {
      if (!stale) setHashed({ text, hash })
    })
    return () => {
      stale = true
    }
  }, [text])

  return hashed.text === text ? hashed.hash : ''
}
