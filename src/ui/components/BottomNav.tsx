import type { IsoDate } from '../../domain/types'
import { addRouteNow, toHash, type Route } from '../router'
import { useToday } from '../todayContext'
import { Icon, type IconName } from './Icon'

type Item = { label: string; icon: IconName; route: Route; active: (r: Route) => boolean; primary?: boolean }

function items(today: IsoDate): Item[] {
  return [
    { label: 'Dag', icon: 'day', route: { name: 'day', date: today }, active: (r) => r.name === 'day' },
    { label: 'Vecka', icon: 'week', route: { name: 'week', date: today }, active: (r) => r.name === 'week' },
    // Måltiden väljs efter klockslaget när menyn ritas
    { label: 'Lägg till', icon: 'plus', route: addRouteNow(new Date()), active: (r) => r.name === 'add', primary: true },
    { label: 'Vikt', icon: 'weight', route: { name: 'weight' }, active: (r) => r.name === 'weight' },
    { label: 'Profil', icon: 'user', route: { name: 'profile' }, active: (r) => r.name === 'profile' || r.name === 'settings' || r.name === 'recipes' },
  ]
}

export function BottomNav({ route }: { route: Route }) {
  const today = useToday()
  return (
    <nav className="bottom-nav" aria-label="Huvudmeny">
      {items(today).map((item) => (
        <a key={item.label} href={toHash(item.route)} aria-current={item.active(route) ? 'page' : undefined}>
          {item.primary ? (
            <span className="nav-primary">
              <Icon name={item.icon} size={20} strokeWidth={2.6} />
            </span>
          ) : (
            <Icon name={item.icon} size={26} strokeWidth={1.9} />
          )}
          <span>{item.label}</span>
        </a>
      ))}
    </nav>
  )
}
