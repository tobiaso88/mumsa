import { macroGrams } from '../../domain/goals'
import type { Goals, Nutrients } from '../../domain/types'
import { ProgressBar } from './ProgressBar'

/** Staplar för energi, protein, kolhydrater och fett mot målet. */
export function MacroProgress({ intake, goals }: { intake: Nutrients; goals: Goals }) {
  const macros = macroGrams(goals.kcal, goals.split)
  return (
    <>
      <ProgressBar label="Energi" value={intake.kcal} goal={goals.kcal} unit="kcal" color="var(--accent)" />
      <ProgressBar label="Protein" value={intake.protein} goal={macros.protein} unit="g" color="var(--protein)" />
      <ProgressBar label="Kolhydrater" value={intake.carbs} goal={macros.carbs} unit="g" color="var(--carbs)" />
      <ProgressBar label="Fett" value={intake.fat} goal={macros.fat} unit="g" color="var(--fat)" />
    </>
  )
}
