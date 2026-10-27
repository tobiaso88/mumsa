import type { ReactNode } from 'react'

type Link = { href: string; label: string }

type Props = {
  title: string
  subtitle: ReactNode
  previous: Link
  next: Link
}

/** Rubrik med pilar till föregående och nästa period, till exempel dag eller vecka. */
export function PeriodHeader({ title, subtitle, previous, next }: Props) {
  return (
    <header className="period-header">
      <a className="icon-button" href={previous.href} aria-label={previous.label}>
        ‹
      </a>
      <div className="period-title">
        <h1>{title}</h1>
        {subtitle}
      </div>
      <a className="icon-button" href={next.href} aria-label={next.label}>
        ›
      </a>
    </header>
  )
}
