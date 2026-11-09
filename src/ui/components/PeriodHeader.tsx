import type { ReactNode } from 'react'
import { Icon } from './Icon'

type Link = { href: string; label: string }

type Props = {
  title: string
  subtitle: ReactNode
  previous: Link
  next: Link
}

/** Stor rubrik med runda pilknappar till föregående och nästa period, till exempel dag eller vecka. */
export function PeriodHeader({ title, subtitle, previous, next }: Props) {
  return (
    <header className="large-title period-header">
      <div className="large-title-text">
        <h1>{title}</h1>
        {subtitle}
      </div>
      <div className="round-buttons">
        <a className="round-button" href={previous.href} aria-label={previous.label}>
          <Icon name="chevronLeft" size={22} strokeWidth={2.2} />
        </a>
        <a className="round-button" href={next.href} aria-label={next.label}>
          <Icon name="chevronRight" size={22} strokeWidth={2.2} />
        </a>
      </div>
    </header>
  )
}
