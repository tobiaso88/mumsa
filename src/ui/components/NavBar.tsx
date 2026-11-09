import type { ReactNode } from 'react'

type Props = {
  title: string
  /** Vänster sida, oftast en Avbryt-länk. */
  leading?: ReactNode
  /** Höger sida, oftast en Spara-knapp. */
  trailing?: ReactNode
}

/** Navigeringsrad för modala skärmar: knapp till vänster, rubrik i mitten och knapp till höger. */
export function NavBar({ title, leading, trailing }: Props) {
  return (
    <header className="nav-bar">
      <div className="nav-bar-side">{leading}</div>
      <h1>{title}</h1>
      <div className="nav-bar-side nav-bar-end">{trailing}</div>
    </header>
  )
}
