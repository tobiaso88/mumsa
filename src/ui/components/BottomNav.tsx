import { toIsoDate } from '../../domain/dates'
import { toHash, type Route } from '../router'

type Item = { label: string; route: Route; active: (r: Route) => boolean }

function items(): Item[] {
  const today = toIsoDate(new Date())
  return [
    { label: 'Dag', route: { name: 'day', date: today }, active: (r) => r.name === 'day' },
    { label: 'Sök', route: { name: 'search' }, active: (r) => r.name === 'search' },
    { label: 'Vecka', route: { name: 'week', date: today }, active: (r) => r.name === 'week' },
    { label: 'Profil', route: { name: 'profile' }, active: (r) => r.name === 'profile' },
  ]
}

export function BottomNav({ route }: { route: Route }) {
  return (
    <nav className="bottom-nav" aria-label="Huvudmeny">
      {items().map((item) => (
        <a key={item.label} href={toHash(item.route)} aria-current={item.active(route) ? 'page' : undefined}>
          {item.label}
        </a>
      ))}
    </nav>
  )
}
