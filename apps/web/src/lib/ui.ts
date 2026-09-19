import { useLiveQuery } from 'dexie-react-hooks'

import { db } from './db'

/** Katlanir bolumlerin acik/kapali hafizasi (PLAN-UI S3). Bos kayit = varsayilan. */
export type SectionState = Record<string, boolean>

export function useSections(): SectionState {
  const stored = useLiveQuery(() => db.settings.get('ui_sections'), [])
  return (stored?.value as SectionState | undefined) ?? {}
}

export async function setSection(id: string, open: boolean): Promise<void> {
  const stored = await db.settings.get('ui_sections')
  const next: SectionState = { ...((stored?.value as SectionState | undefined) ?? {}), [id]: open }
  await db.settings.put({ key: 'ui_sections', value: next })
}
