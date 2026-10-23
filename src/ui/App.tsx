import type { MumsaDb } from '../data/db'
import { BottomNav } from './components/BottomNav'
import { DbProvider } from './DbProvider'
import { useGoals } from './hooks/useSettings'
import { useRoute } from './router'
import { DayScreen } from './screens/DayScreen'
import { OnboardingScreen } from './screens/OnboardingScreen'
import { PlaceholderScreen } from './screens/PlaceholderScreen'
import { ProfileScreen } from './screens/ProfileScreen'

function Shell() {
  const goals = useGoals()
  const route = useRoute()

  if (goals === undefined) return null
  if (goals === null) return <OnboardingScreen />

  return (
    <>
      {route.name === 'day' && <DayScreen date={route.date} goals={goals} />}
      {route.name === 'search' && <PlaceholderScreen title="Sök livsmedel" />}
      {route.name === 'week' && <PlaceholderScreen title="Veckan" />}
      {route.name === 'profile' && <ProfileScreen goals={goals} />}
      <BottomNav route={route} />
    </>
  )
}

export function App({ db }: { db?: MumsaDb }) {
  return (
    <DbProvider db={db}>
      <Shell />
    </DbProvider>
  )
}
