import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '../lib/db'
import { useGoals } from '../lib/settings'
import { groupsFor, useSplit } from '../lib/split'

/**
 * Gunun tek bakista ozeti. Bes olcumu esit agirlikta gostermek yerine tek
 * kapanabilir hedef one aliniyor (protein halkasi); adim ve ajanda yanina
 * kucuk satir olarak giriyor. Trend Hafta ekraninda kaliyor.
 */
export function DayHeader({ date }: { date: string }) {
  const goals = useGoals()
  const split = useSplit()
  const log = useLiveQuery(() => db.daily_log.get(date), [date])
  const workouts = useLiveQuery(() => db.workout.where('date').equals(date).toArray(), [date]) ?? []

  const protein = log?.protein_g ?? 0
  const pct = Math.min(100, Math.round((protein / goals.protein_g) * 100))
  const planned = groupsFor(split, date)
  const trained = workouts.some((w) => !w.needs_review && w.type !== 'rest')

  // Halka cevresi: r = 34 icin 2*pi*r. Kalan pay strokeDasharray ile bosluga cevriliyor.
  const circumference = 2 * Math.PI * 34

  return (
    <section className="glass-card flex items-center gap-5 p-5">
      <div className="relative shrink-0">
        <svg viewBox="0 0 80 80" className="size-20 -rotate-90">
          <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="7" className="text-glass-strong" />
          <circle
            cx="40"
            cy="40"
            r="34"
            fill="none"
            stroke="currentColor"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * circumference} ${circumference}`}
            className="text-a1 transition-[stroke-dasharray] duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-semibold leading-none tabular-nums">{protein}</span>
          <span className="text-[10px] text-ink-faint">/ {goals.protein_g} g</span>
        </div>
      </div>

      <div className="min-w-0 flex-1 space-y-1.5 text-sm">
        <p className="text-ink-dim">
          {pct >= 100 ? 'Protein hedefi tamam.' : `Protein hedefinin %${pct}'i.`}
        </p>
        <p className="text-xs text-ink-faint">
          {log?.steps != null ? `${log.steps.toLocaleString('tr-TR')} adım` : 'adım kaydı yok'}
          {log?.weight_kg != null ? ` · ${log.weight_kg} kg` : ''}
        </p>
        <p className="text-xs">
          {planned.length === 0 ? (
            <span className="text-ink-faint">Bugün için program yok</span>
          ) : trained ? (
            <span className="text-a1">{planned.join(', ')} günü · kaydedildi</span>
          ) : (
            <span className="text-ink-dim">{planned.join(', ')} günü · henüz kayıt yok</span>
          )}
        </p>
      </div>
    </section>
  )
}
