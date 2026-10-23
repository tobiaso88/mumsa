// Tillfällig vy för sök och vecka tills de byggs i fas 5 och 6
export function PlaceholderScreen({ title }: { title: string }) {
  return (
    <main className="screen stack">
      <h1>{title}</h1>
      <p className="hint">Kommer snart.</p>
    </main>
  )
}
