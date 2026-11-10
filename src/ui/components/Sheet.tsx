import { useEffect, useId, useRef, type ReactNode } from 'react'
import { useSwipeToClose } from '../hooks/useSwipeToClose'
import { Icon } from './Icon'

type Props = {
  title: string
  /** Rad under rubriken, till exempel källa och energi per 100 g. */
  subtitle?: ReactNode
  /** Knapp uppe till höger i stället för stängknappen, t.ex. för att ändra livsmedlet. */
  action?: ReactNode
  onClose: () => void
  children: ReactNode
}

/** Ark som glider upp från nederkanten. Stängs med Escape, klick utanför eller genom att dra ner det. */
export function Sheet({ title, subtitle, action, onClose, children }: Props) {
  const titleId = useId()
  const sheetRef = useRef<HTMLDivElement>(null)
  useSwipeToClose(sheetRef, onClose)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div ref={sheetRef} className="sheet" role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grabber" aria-hidden="true" />
        <header className="sheet-header">
          <div className="sheet-title">
            <h2 id={titleId}>{title}</h2>
            {subtitle && <p className="hint">{subtitle}</p>}
          </div>
          {action ?? (
            <button type="button" className="round-button" aria-label="Stäng" onClick={onClose}>
              <Icon name="close" size={20} strokeWidth={2.2} />
            </button>
          )}
        </header>
        {children}
      </div>
    </div>
  )
}
