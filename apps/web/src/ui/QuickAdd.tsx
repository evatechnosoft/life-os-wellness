import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'

import { db } from '../lib/db'
import { frequentPortions } from '../lib/metrics'
import { addProtein, addWorkout, saveDaily } from '../lib/store'
import { ProductPicker } from './ProductPicker'
import { Sheet } from './Sheet'
import { draftToWorkout, emptyDraft, WorkoutFields, type WorkoutDraft } from './WorkoutForm'

type Row = 'meal' | 'protein' | 'measure' | 'workout'

const ROWS: { id: Row; label: string }[] = [
  { id: 'meal', label: 'Öğün' },
  { id: 'protein', label: 'Protein' },
  { id: 'measure', label: 'Kilo · Adım' },
  { id: 'workout', label: 'Antrenman' },
]

const SAVE = 'min-h-11 rounded-field bg-a1/90 px-4 text-sm font-medium active:bg-a1 disabled:opacity-40'
const NUM = 'min-h-11 w-24 rounded-field bg-glass-inset px-3 text-center tabular-nums outline-none focus:ring-2 focus:ring-a1'

/**
 * Hizli ekle (PLAN-UI S14). Dort satir, secilen satirin formu hemen altinda
 * acilir - sayfa degismez, ayni kayit yollari kullanilir (Bugun ekraniyla ortak).
 */
export function QuickAdd({ date, open, onClose }: { date: string; open: boolean; onClose: () => void }) {
  const [row, setRow] = useState<Row | null>(null)
  const [weight, setWeight] = useState('')
  const [steps, setSteps] = useState('')
  const [draft, setDraft] = useState<WorkoutDraft>(emptyDraft)
  const recentMeals = useLiveQuery(() => db.meal.reverse().limit(60).toArray(), []) ?? []
  const pulses = frequentPortions(recentMeals.map((m) => m.protein_g))

  // Her acilista temiz baslar: yarim kalan bir taslak bir sonraki sefere tasinmasin.
  useEffect(() => {
    if (!open) {
      setRow(null)
      setWeight('')
      setSteps('')
      setDraft(emptyDraft)
    }
  }, [open])

  const saveMeasure = async () => {
    const w = weight.trim() === '' ? null : Number(weight)
    const s = steps.trim() === '' ? null : Number(steps)
    const patch: { weight_kg?: number; steps?: number } = {}
    if (w != null && Number.isFinite(w)) patch.weight_kg = w
    if (s != null && Number.isFinite(s)) patch.steps = s
    if (Object.keys(patch).length === 0) return
    await saveDaily(date, patch)
    onClose()
  }

  const saveWorkout = async () => {
    await addWorkout({ date, ...draftToWorkout(draft) })
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title="Hızlı ekle">
      <ul className="space-y-1">
        {ROWS.map((r) => {
          const active = row === r.id
          return (
            <li key={r.id}>
              <button
                type="button"
                aria-expanded={active}
                onClick={() => setRow(active ? null : r.id)}
                className={`flex min-h-11 w-full items-center rounded-field px-3 text-left text-sm ${
                  active ? 'bg-glass-strong text-ink' : 'bg-glass-inset text-ink-dim'
                }`}
              >
                {r.label}
                <span aria-hidden className={`ml-auto text-ink-faint transition-transform ${active ? 'rotate-90' : ''}`}>
                  ›
                </span>
              </button>

              {active && (
                <div className="px-1 pt-2 pb-1">
                  {r.id === 'meal' && <ProductPicker date={date} onSaved={onClose} />}

                  {r.id === 'protein' && (
                    <div className="flex gap-2">
                      {pulses.map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => {
                            void addProtein(date, g)
                            onClose()
                          }}
                          className="min-h-11 flex-1 rounded-field bg-a1/90 text-sm font-medium active:bg-a1"
                        >
                          +{g}
                        </button>
                      ))}
                    </div>
                  )}

                  {r.id === 'measure' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        inputMode="decimal"
                        step={0.1}
                        aria-label="kilo (kg)"
                        placeholder="kg"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className={NUM}
                      />
                      <input
                        type="number"
                        inputMode="numeric"
                        aria-label="adım"
                        placeholder="adım"
                        value={steps}
                        onChange={(e) => setSteps(e.target.value)}
                        className={NUM}
                      />
                      <button
                        type="button"
                        onClick={() => void saveMeasure()}
                        disabled={weight.trim() === '' && steps.trim() === ''}
                        className={`ml-auto ${SAVE}`}
                      >
                        Kaydet
                      </button>
                    </div>
                  )}

                  {r.id === 'workout' && (
                    <>
                      <WorkoutFields value={draft} onChange={setDraft} showMinutes />
                      <button type="button" onClick={() => void saveWorkout()} className={`mt-3 w-full ${SAVE}`}>
                        Kaydet
                      </button>
                    </>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </Sheet>
  )
}
