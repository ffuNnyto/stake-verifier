import { useState } from 'react'
import { thumbUrl } from '@/lib/images'
import { cn } from '@/lib/utils'

interface Props {
  src?: string
  name: string
  width?: number
  className?: string
}

export default function GameImage({ src, name, width = 320, className }: Props) {
  const [stage, setStage] = useState(0)

  if (!src || stage > 1) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gradient-to-br from-secondary to-card text-3xl font-bold text-muted-foreground',
          className,
        )}
        aria-label={name}
      >
        {name.slice(0, 2).toUpperCase()}
      </div>
    )
  }

  return (
    <img
      src={stage === 0 ? thumbUrl(src, width) : src}
      alt={name}
      loading="lazy"
      decoding="async"
      onError={() => setStage((s) => s + 1)}
      className={cn('object-cover', className)}
    />
  )
}
