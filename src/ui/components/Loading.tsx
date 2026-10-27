/** Visas medan en skärm läser in sin data. Texten tonas in först efter en stund, så att snabba laddningar inte blinkar. */
export function Loading() {
  return (
    <main className="screen">
      <p className="hint loading" role="status">
        Laddar …
      </p>
    </main>
  )
}
