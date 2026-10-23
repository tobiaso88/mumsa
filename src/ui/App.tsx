import type { MumsaDb } from '../data/db'
import { BottomNav } from './components/BottomNav'
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

  if (goals === undefined) return null
  if (goals === null) return <OnboardingScreen />

  return (
    <>
      {route.name === 'day' && <DayScreen date={route.date} goals={goals} />}
      {route.name === 'add' && <AddFoodScreen key={toHash(route)} date={route.date} meal={route.meal} foodId={route.foodId} />}
      {route.name === 'scan' && <ScanScreen key={toHash(route)} date={route.date} meal={route.meal} />}
      {route.name === 'food' && <FoodFormScreen key={toHash(route)} {...route} />}
      {route.name === 'week' && <WeekScreen date={route.date} goals={goals} />}
      {route.name === 'profile' && <ProfileScreen goals={goals} />}
      {route.name === 'settings' && <SettingsScreen />}
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
