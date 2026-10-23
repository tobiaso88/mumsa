// Tillfällig vy för veckan tills den byggs i fas 6
export function PlaceholderScreen({ title }: { title: string }) {
  return (
    <main className="screen stack">
      <h1>{title}</h1>
      <p className="hint">Kommer snart.</p>
    </main>
  )
}
