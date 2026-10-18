import { ShieldCheck } from 'lucide-react'
import GithubIcon from '@/components/GithubIcon'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { REPO_URL } from '@/lib/constants'

interface Props {
  onHome: () => void
}

export default function Header({ onHome }: Props) {
  return (
    <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-6">
        <button type="button" onClick={onHome} className="flex items-center gap-2 font-semibold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="size-5" />
          </span>
          Seed Checker
        </button>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="hidden sm:inline-flex">
            Unofficial · Stake Engine
          </Badge>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View the source code on GitHub"
            title="View the source code on GitHub"
            className={buttonVariants({ variant: 'ghost', size: 'icon' })}
          >
            <GithubIcon className="size-5" />
          </a>
        </div>
      </div>
    </header>
  )
}
