import { SLV_ATTRIBUTION } from '../../data/livsmedelsverket'

export function AboutSection() {
  return (
    <section className="card stack" aria-labelledby="about-title">
      <h2 id="about-title">Om Mumsa</h2>
      <div>
        <h3>Installera på mobilen</h3>
        <p className="hint">
          iPhone: öppna sidan i Safari, tryck på Dela och välj Lägg till på hemskärmen. Android: öppna sidan i Chrome och
          välj Installera app i menyn. Appen fungerar sedan offline.
        </p>
      </div>
      <div>
        <h3>Källor</h3>
        <ul className="hint source-list">
          <li>
            {SLV_ATTRIBUTION}.{' '}
            <a href="https://www.livsmedelsverket.se/livsmedelsdatabasen" target="_blank" rel="noreferrer">
              livsmedelsverket.se
            </a>
          </li>
          <li>
            Produkter via streckkod: Open Food Facts (ODbL), data från bidragsgivare.{' '}
            <a href="https://world.openfoodfacts.org" target="_blank" rel="noreferrer">
              openfoodfacts.org
            </a>
          </li>
        </ul>
      </div>
      <p className="hint">
        Mumsa ger inga medicinska råd. Beräknade mål är uppskattningar från en standardformel. Vänd dig till vården om du har
        frågor om kost och hälsa.
      </p>
    </section>
  )
}
