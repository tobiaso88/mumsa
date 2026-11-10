import { useState } from 'react'
import { ListGroup } from './ListGroup'
import { Sheet } from './Sheet'

const SLV_ATTRIBUTION = 'Källa: Livsmedelsverkets livsmedelsdatabas (CC BY 4.0)'

function InstallSheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet title="Installera på hemskärmen" onClose={onClose}>
      <div className="stack">
        <p>
          <strong>iPhone:</strong> öppna sidan i Safari, tryck på Dela och välj Lägg till på hemskärmen.
        </p>
        <p>
          <strong>Android:</strong> öppna sidan i Chrome och välj Installera app i menyn.
        </p>
        <p className="hint">Appen fungerar sedan offline.</p>
      </div>
    </Sheet>
  )
}

function SourcesSheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet title="Källor" onClose={onClose}>
      <ul className="source-list stack">
        <li>
          Livsmedelsverkets livsmedelsdatabas (CC BY 4.0).{' '}
          <a href="https://www.livsmedelsverket.se/livsmedelsdatabasen" target="_blank" rel="noreferrer">
            livsmedelsverket.se
          </a>
        </li>
        <li>
          Hushållsmått: Livsmedelsverket, Volymvikter, viktförändringsfaktorer och avfall (PM 2024). Vikterna är ungefärliga.{' '}
          <a
            href="https://www.livsmedelsverket.se/globalassets/publikationsdatabas/pm/2024/pm-2024-volymvikter-viktforandringsfaktorer-och-avfall.pdf"
            target="_blank"
            rel="noreferrer"
          >
            livsmedelsverket.se
          </a>
        </li>
        <li>
          Produkter via streckkod: Open Food Facts, data från bidragsgivare under ODbL.{' '}
          <a href="https://world.openfoodfacts.org" target="_blank" rel="noreferrer">
            openfoodfacts.org
          </a>
        </li>
      </ul>
    </Sheet>
  )
}

export function AboutSection() {
  const [open, setOpen] = useState<'install' | 'sources' | null>(null)
  const close = () => setOpen(null)
  return (
    <>
      <ListGroup
        title="Om Mumsa"
        rows={[
          { label: 'Installera på hemskärmen', icon: 'share', tint: 'var(--text-faint)', onClick: () => setOpen('install') },
          { label: 'Källor', icon: 'book', tint: 'var(--carbs)', onClick: () => setOpen('sources') },
        ]}
        footer={
          <p>
            Mumsa ger inga medicinska råd. Beräknade mål är uppskattningar från en standardformel. Vänd dig till vården om du
            har frågor om kost och hälsa. {SLV_ATTRIBUTION}. Produkter via streckkod: Open Food Facts (ODbL).
          </p>
        }
      />
      {open === 'install' && <InstallSheet onClose={close} />}
      {open === 'sources' && <SourcesSheet onClose={close} />}
    </>
  )
}
