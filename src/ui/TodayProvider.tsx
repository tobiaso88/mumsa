import { useEffect, useState, type ReactNode } from 'react'
import { toIsoDate } from '../domain/dates'
import { TodayContext } from './todayContext'

const CHECK_INTERVAL_MS = 60_000

/** Håller dagens datum för hela appen, så att alla vyer byter dag samtidigt. */
export function TodayProvider({ children }: { children: ReactNode }) {
  const [today, setToday] = useState(() => toIsoDate(new Date()))

  useEffect(() => {
    const update = () => setToday(toIsoDate(new Date()))
    // Kontrollerar varje minut i stället för att vänta till midnatt, eftersom mobilen pausar
    // timers när appen ligger i bakgrunden. Därför kontrolleras datumet också när appen visas igen.
    const timer = setInterval(update, CHECK_INTERVAL_MS)
    document.addEventListener('visibilitychange', update)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', update)
    }
  }, [])

  return <TodayContext.Provider value={today}>{children}</TodayContext.Provider>
}
