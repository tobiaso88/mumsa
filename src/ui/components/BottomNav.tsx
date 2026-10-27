import type { IsoDate } from '../../domain/types'
import { addRouteNow, toHash, type Route } from '../router'
import { useToday } from '../todayContext'

type Item = { label: string; route: Route; active: (r: Route) => boolean }

function items(today: IsoDate): Item[] {
  return [
    { label: 'Dag', route: { name: 'day', date: today }, active: (r) => r.name === 'day' },
    // Måltiden väljs efter klockslaget när menyn ritas
    { label: 'Lägg till', route: addRouteNow(new Date()), active: (r) => r.name === 'add' },
    { label: 'Vecka', route: { name: 'week', date: today }, active: (r) => r.name === 'week' },
    { label: 'Profil', route: { name: 'profile' }, active: (r) => r.name === 'profile' || r.name === 'settings' },
  ]
}

export function BottomNav({ route }: { route: Route }) {
  const today = useToday()
  return (
    <nav className="bottom-nav" aria-label="Huvudmeny">
      {items(today).map((item) => (
        <a key={item.label} href={toHash(item.route)} aria-current={item.active(route) ? 'page' : undefined}>
          {item.label}
        </a>
      ))}
    </nav>
  )
}
