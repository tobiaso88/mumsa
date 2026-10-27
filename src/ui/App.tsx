import type { MumsaDb } from '../data/db'
import { BottomNav } from './components/BottomNav'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Loading } from './components/Loading'
import { DbProvider } from './DbProvider'
import { useGoals } from './hooks/useSettings'
import { toHash, useRoute } from './router'
import { DayScreen } from './screens/DayScreen'
import { OnboardingScreen } from './screens/OnboardingScreen'
import { AddFoodScreen } from './screens/AddFoodScreen'
import { FoodFormScreen } from './screens/FoodFormScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { ScanScreen } from './screens/ScanScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { WeekScreen } from './screens/WeekScreen'

function Shell() {
  const goals = useGoals()
  const route = useRoute()

  if (goals === undefined) return <Loading />
  // Inställningarna går att nå utan mål så att en ny enhet kan importera en säkerhetskopia
  if (goals === null && route.name !== 'settings') return <OnboardingScreen />

  // Inställningarna ligger först så att de inte monteras om när en import skapar ett mål
  return (
    <>
      {route.name === 'settings' && <SettingsScreen />}
      {goals && (
        <>
          {route.name === 'day' && <DayScreen date={route.date} goals={goals} />}
          {route.name === 'add' && <AddFoodScreen key={toHash(route)} date={route.date} meal={route.meal} foodId={route.foodId} />}
          {route.name === 'scan' && <ScanScreen key={toHash(route)} date={route.date} meal={route.meal} />}
          {route.name === 'food' && <FoodFormScreen key={toHash(route)} {...route} />}
          {route.name === 'week' && <WeekScreen date={route.date} goals={goals} />}
          {route.name === 'profile' && <ProfileScreen goals={goals} />}
          <BottomNav route={route} />
        </>
      )}
    </>
  )
}

export function App({ db }: { db?: MumsaDb }) {
  return (
    <DbProvider db={db}>
      <ErrorBoundary>
        <Shell />
      </ErrorBoundary>
    </DbProvider>
  )
}
