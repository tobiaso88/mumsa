import { useEffect, useId, type ReactNode } from 'react'
import { Icon } from './Icon'

type Props = {
  title: string
  /** Rad under rubriken, till exempel källa och energi per 100 g. */
  subtitle?: ReactNode
  onClose: () => void
  children: ReactNode
}

/** Ark som glider upp från nederkanten. Stängs med Escape eller klick utanför. */
export function Sheet({ title, subtitle, onClose, children }: Props) {
  const titleId = useId()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grabber" aria-hidden="true" />
        <header className="sheet-header">
          <div className="sheet-title">
            <h2 id={titleId}>{title}</h2>
            {subtitle && <p className="hint">{subtitle}</p>}
          </div>
          <button type="button" className="round-button" aria-label="Stäng" onClick={onClose}>
            <Icon name="close" size={20} strokeWidth={2.2} />
          </button>
        </header>
        {children}
      </div>
    </div>
  )
}
