import { useState } from 'react'

import { toLocalDate } from '../lib/date'
import { alternatives, find, search } from '../lib/exercises'
import { addExercise, moveExercise, removeExercise, replaceExercise, stepSets } from '../lib/planEdit'
import { WEEKDAYS } from '../lib/split'
import { DAY_TYPE_LABEL, saveDay, useWorkoutPlan, type DayType, type PlanExercise } from '../lib/workoutPlan'
import { Exercise } from './Exercise'
import { Sheet } from './Sheet'

const TYPES: DayType[] = ['lift', 'swim', 'rest']

// Pazartesi'den gosterilir, sayilar getDay ile ayni kalir (0 = pazar).
const ORDER = [1, 2, 3, 4, 5, 6, 0]

/**
 * Hafta sablonu: her gune bir tip. Zar ve kas haritasi bir sonraki adimda
 * (spec S4); once plan sunucuda yasasin ki sohbet ve uygulama ayni haftayi gorsun.
 */
export function Plan() {
  const plan = useWorkoutPlan()
  const [saving, setSaving] = useState<number | null>(null)
  // Which move is open in the sheet; index -1 = adding a new one, at `at` (a removed move's slot) or the end.
  const [editing, setEditing] = useState<{ weekday: number; index: number; at?: number } | null>(null)
  const [query, setQuery] = useState('')
  const today = new Date(toLocalDate() + 'T00:00:00').getDay()

  const pick = (weekday: number, day_type: DayType) => {
    setSaving(weekday)
    void saveDay({ weekday, day_type }).finally(() => setSaving(null))
  }

  const moves = editing ? (plan[editing.weekday]?.exercises ?? []) : []
  const current = editing && editing.index >= 0 ? moves[editing.index] : undefined
  const currentEx = current ? find(current.id) : null
  const results = query.trim() ? search(query).slice(0, 8) : []
  const swaps = current ? alternatives(current.id).slice(0, 6) : []

  const write = (list: PlanExercise[]) => {
    if (!editing) return
    void saveDay({ weekday: editing.weekday, day_type: 'lift', exercises: list })
  }
  const close = () => {
    setEditing(null)
    setQuery('')
  }
  const move = (delta: 1 | -1) => {
    if (!editing) return
    const to = editing.index + delta
    if (to < 0 || to >= moves.length) return
    write(moveExercise(moves, editing.index, delta))
    setEditing({ ...editing, index: to })
  }
  const choose = (id: string) => {
    if (!editing) return
    if (editing.index < 0) {
      write(addExercise(moves, id, editing.at))
      close()
    } else {
      write(replaceExercise(moves, editing.index, id))
      setQuery('')
    }
  }

  return (
    <section className="flex flex-col gap-3 pt-2">
      <header>
        <h2 className="text-xl font-semibold">Hafta</h2>
        <p className="text-sm text-ink-dim">Her güne bir tip. Sohbet de aynı planı görür.</p>
      </header>

      {ORDER.map((weekday) => {
        const day = plan[weekday]
        const isToday = weekday === today
        return (
          <div key={weekday} className={`rounded-card px-4 py-3 ${isToday ? 'bg-glass-strong' : 'bg-glass'}`}>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className={isToday ? 'font-medium' : ''}>{WEEKDAYS[weekday]}</span>
                {day?.label && <span className="text-xs text-ink-faint">{day.label}</span>}
              </div>
              <div className="flex gap-1" role="group" aria-label={`${WEEKDAYS[weekday]} tipi`}>
                {TYPES.map((type) => {
                  const active = day?.day_type === type
                  return (
                    <button
                      key={type}
                      type="button"
                      aria-pressed={active}
                      disabled={saving === weekday}
                      onClick={() => pick(weekday, type)}
                      className={`rounded-pill px-3 py-1.5 text-xs transition-colors ${
                        active ? 'bg-a1 text-solid' : 'text-ink-dim active:bg-glass-strong'
                      } disabled:opacity-50`}
                    >
                      {DAY_TYPE_LABEL[type]}
                    </button>
                  )
                })}
              </div>
            </div>
            {/* The day's moves (coach-written preset). Without this the tab showed only the day type. */}
            {day?.day_type === 'lift' && (
              <ol className="mt-2 border-t border-edge-soft pt-1 text-xs text-ink-dim">
                {(day.exercises ?? []).map((ex, i) => (
                  <li key={`${ex.id}-${i}`}>
                    <button type="button" onClick={() => setEditing({ weekday, index: i })}
                      className="flex min-h-10 w-full items-center justify-between gap-2 text-left active:bg-glass">
                      <span className="truncate">{i + 1}. {find(ex.id)?.name ?? ex.id}</span>
                      <span className="shrink-0 text-ink-faint">
                        {ex.sets ?? '—'} set{ex.warmup ? ` + ${ex.warmup} rampa` : ''} ›
                      </span>
                    </button>
                  </li>
                ))}
                <li>
                  <button type="button" onClick={() => setEditing({ weekday, index: -1 })}
                    className="min-h-10 w-full text-left text-a1">
                    + Hareket ekle
                  </button>
                </li>
              </ol>
            )}
          </div>
        )
      })}

      <Sheet open={editing !== null} onClose={close}
        title={current ? (currentEx?.name ?? current.id) : 'Hareket ekle'}>
        {editing && editing.at !== undefined && (
          <p className="px-1 text-xs text-ink-faint">Kaldırıldı. Seçtiğin hareket {editing.at + 1}. sıraya girer.</p>
        )}
        {editing && current && (
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <button type="button" aria-label="Set azalt" onClick={() => write(stepSets(moves, editing.index, -1))}
                className="size-11 rounded-full bg-glass-strong text-lg">−</button>
              <span className="w-14 text-center text-sm tabular-nums">{current.sets ?? 3} set</span>
              <button type="button" aria-label="Set artır" onClick={() => write(stepSets(moves, editing.index, 1))}
                className="size-11 rounded-full bg-glass-strong text-lg">+</button>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" aria-label="Yukarı taşı" disabled={editing.index === 0} onClick={() => move(-1)}
                className="size-11 rounded-full bg-glass-strong disabled:opacity-30">↑</button>
              <button type="button" aria-label="Aşağı taşı" disabled={editing.index === moves.length - 1} onClick={() => move(1)}
                className="size-11 rounded-full bg-glass-strong disabled:opacity-30">↓</button>
              {/* Sheet stays open in add mode so a new pick lands in the same slot. */}
              <button type="button" onClick={() => {
                write(removeExercise(moves, editing.index))
                setEditing({ weekday: editing.weekday, index: -1, at: editing.index })
              }}
                className="min-h-11 rounded-pill px-3 text-sm text-load">
                Kaldır
              </button>
            </div>
          </div>
        )}

        {swaps.length > 0 && !query && (
          <div className="mt-3">
            <p className="px-1 text-xs text-ink-faint">Yerine geç — dokun, aynı sırada değişsin</p>
            <div className="-mx-4 mt-1.5 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {swaps.map((a) => (
                <button key={a.id} type="button" onClick={() => choose(a.id)}
                  className="min-h-10 shrink-0 rounded-pill bg-glass-strong px-3 text-xs active:bg-a1 active:text-solid">
                  {a.name} <span className="text-ink-faint">· {a.equipment_tr}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={current ? 'Kütüphanede ara, yerine koy' : 'Kütüphanede ara'}
          className="mt-3 min-h-11 w-full rounded-pill bg-glass-inset px-4 text-sm outline-none focus:ring-2 focus:ring-a1"
        />
        {results.length > 0 && (
          <ul className="mt-2">
            {results.map((r) => (
              <li key={r.id}>
                <button type="button" onClick={() => choose(r.id)}
                  className="flex min-h-11 w-full items-center justify-between gap-2 rounded-field px-2 text-left text-sm active:bg-glass">
                  <span className="truncate">{r.name}</span>
                  <span className="shrink-0 text-xs text-ink-faint">{r.equipment_tr}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* The library card; its alternative chips swap the move in place. */}
        {currentEx && !query && <Exercise ex={currentEx} onPick={choose} />}
      </Sheet>
    </section>
  )
}
