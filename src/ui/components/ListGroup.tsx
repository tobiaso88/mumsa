import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

export type ListRow = {
  label: ReactNode
  value?: ReactNode
  /** Leder till en annan vy. */
  href?: string
  onClick?: () => void
  /** Raden är etikett för ett fält, t.ex. en dold filväljare. */
  htmlFor?: string
  icon?: IconName
  /** Bakgrund på ikonrutan. */
  tint?: string
  /** Texten i accentfärg, för rader som är knappar. */
  accent?: boolean
  /** Något längst till höger, t.ex. en brytare. */
  trailing?: ReactNode
  disabled?: boolean
}

type Props = {
  title?: string
  footer?: ReactNode
  rows: ListRow[]
  label?: string
}

function RowContent({ row, chevron }: { row: ListRow; chevron: boolean }) {
  return (
    <>
      {row.icon && (
        <span className="list-icon" style={{ background: row.tint ?? 'var(--accent)' }}>
          <Icon name={row.icon} size={18} strokeWidth={2.2} />
        </span>
      )}
      <span className="list-row-body">
        <span className={row.accent ? 'list-label accent' : 'list-label'}>{row.label}</span>
        {row.value !== undefined && <span className="list-value">{row.value}</span>}
        {row.trailing}
        {chevron && <span className="chevron" aria-hidden="true" />}
      </span>
    </>
  )
}

function Row({ row }: { row: ListRow }) {
  if (row.href) {
    return (
      <a className="list-row" href={row.href}>
        <RowContent row={row} chevron />
      </a>
    )
  }
  if (row.htmlFor) {
    return (
      <label className="list-row" htmlFor={row.htmlFor}>
        <RowContent row={row} chevron={false} />
      </label>
    )
  }
  if (row.onClick) {
    return (
      <button type="button" className="list-row" onClick={row.onClick} disabled={row.disabled}>
        <RowContent row={row} chevron={!row.accent} />
      </button>
    )
  }
  return (
    <div className="list-row">
      <RowContent row={row} chevron={false} />
    </div>
  )
}

/** Grupperad lista som i inställningarna på en mobil: rubrik ovanför, rader i ett kort och text under. */
export function ListGroup({ title, footer, rows, label }: Props) {
  return (
    <section className="list-group" aria-label={label ?? title}>
      {title && <h2 className="section-title">{title}</h2>}
      <ul className="list-card">
        {rows.map((row, i) => (
          <li key={i}>
            <Row row={row} />
          </li>
        ))}
      </ul>
      {footer && <div className="list-footer">{footer}</div>}
    </section>
  )
}
