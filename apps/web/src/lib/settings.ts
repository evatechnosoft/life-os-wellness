import { useLiveQuery } from 'dexie-react-hooks'

import { db } from './db'

export interface Goals {
  protein_g: number
  weekly_weight_loss_kg: number
  sets_per_group: number
}

export const DEFAULT_GOALS: Goals = {
  protein_g: 140,
  weekly_weight_loss_kg: 0.6,
  sets_per_group: 10,
}

export function useGoals(): Goals {
  const stored = useLiveQuery(() => db.settings.get('goals'), [])
  return { ...DEFAULT_GOALS, ...((stored?.value as Partial<Goals> | undefined) ?? {}) }
}

export async function saveGoals(goals: Goals): Promise<void> {
  await db.settings.put({ key: 'goals', value: goals })
}
