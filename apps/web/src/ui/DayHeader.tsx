import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'

import { lastDates } from '../lib/date'
import { db } from '../lib/db'
import { dayAverage, movingAverage, weightDelta } from '../lib/metrics'
import { useGoals } from '../lib/settings'
import { groupsFor, useSplit } from '../lib/split'
import { saveDaily } from '../lib/store'

/** Ust seritteki kucuk kart: sayi gorunur, dokununca ayni yerde yazilir. */
function QuickField({
  label,
  unit,
  value,
  step,
  onCommit,
}: {
  label: string
  unit: string
  value: number | null | undefined
  step: number
  onCommit: (v: number | null) => void
}) {
  const [draft, setDraft] = useState(value == null ? '' : String(value))
  useEffect(() => setDraft(value == null ? '' : String(value)), [value])
  const commit = () => {
    const t = draft.trim()
    if (t === '') return onCommit(null)
    const n = Number(t.replace(',', '.'))
    if (Number.isFinite(n)) onCommit(n)
    else setDraft(value == null ? '' : String(value))
  }
  return (
    <label className="glass-card flex min-w-0 flex-1 items-baseline gap-1.5 px-4 py-3">
      <span className="text-xs text-ink-faint">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        step={step}
        value={draft}
        placeholder="—"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        className="w-16 min-w-0 flex-1 bg-transparent text-right text-lg font-semibold tabular-nums text-ink outline-none"
      />
      <span className="text-xs text-ink-faint">{unit}</span>
    </label>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="glass-card min-w-0 flex-1 px-3 py-3">
      <div className="text-[10px] uppercase tracking-wide text-ink-faint">{label}</div>
      <div className="mt-0.5 truncate text-base font-semibold tabular-nums">{value}</div>
      {hint && <div className="truncate text-[11px] text-ink-faint">{hint}</div>}
    </div>
  )
}

/**
 * Gunun ust blogu (PLAN-UI, OpenNutriTracker iskeleti): iki hizli giris karti,
 * ortada tek kapanabilir hedef (protein halkasi) ve yaninda karar birimi olan
 * 7-gun ortalamasi, altinda uc esit bilgi karti. Kalori sayaci bilerek yok.
 */
export function DayHeader({ date }: { date: string }) {
  const goals = useGoals()
  const split = useSplit()
  const log = useLiveQuery(() => db.daily_log.get(date), [date])
  const workouts = useLiveQuery(() => db.workout.where('date').equals(date).toArray(), [date]) ?? []
  const week = lastDates(7, new Date(`${date}T12:00:00`))
  const weekLogs =
    useLiveQuery(() => db.daily_log.where('date').between(week[0]!, week[6]!, true, true).toArray(), [date]) ?? []
  const wearable = useLiveQuery(() => db.wearable.where('date').equals(date).toArray(), [date]) ?? []

  const protein = log?.protein_g ?? 0
  const pct = Math.min(100, Math.round((protein / goals.protein_g) * 100))
  const planned = groupsFor(split, date)
  const trained = workouts.some((w) => !w.needs_review && w.type !== 'rest')
  const avg = movingAverage(weekLogs.map((l) => l.weight_kg))
  const delta = weightDelta(weekLogs)
  const sleep = dayAverage(wearable, 'sleep_min')
  const hr = dayAverage(wearable, 'resting_hr')

  // Halka cevresi: r = 34 icin 2*pi*r. Kalan pay strokeDasharray ile bosluga cevriliyor.
  const circumference = 2 * Math.PI * 34

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <QuickField label="Kilo" unit="kg" step={0.1} value={log?.weight_kg} onCommit={(v) => void saveDaily(date, { weight_kg: v })} />
        <QuickField label="Adım" unit="" step={100} value={log?.steps} onCommit={(v) => void saveDaily(date, { steps: v })} />
      </div>

      <section className="glass-card flex items-center gap-5 p-5">
        <div className="relative shrink-0">
          <svg viewBox="0 0 80 80" className="size-24 -rotate-90">
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
            <span className="text-xl font-semibold leading-none tabular-nums">{protein}</span>
            <span className="text-[10px] text-ink-faint">/ {goals.protein_g} g</span>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-sm text-ink-dim">{pct >= 100 ? 'Protein hedefi tamam.' : `Protein hedefinin %${pct}'i.`}</p>
          <p className="text-2xl font-semibold tabular-nums">
            {avg != null ? `${avg.toFixed(1)} kg` : '—'}
            <span className="ml-2 text-xs font-normal text-ink-faint">7 gün ort.</span>
          </p>
          <p className="text-xs text-ink-faint">
            {delta != null ? `${delta > 0 ? '+' : ''}${delta.toFixed(1)} kg bu hafta` : 'haftalık değişim için 2+ tartı gerekir'}
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

      <div className="flex gap-3">
        <Stat label="Sebze" value={`${log?.veg_servings ?? 0}/5`} hint="porsiyon" />
        <Stat
          label="Uyku"
          value={sleep != null ? `${Math.floor(sleep / 60)}s ${Math.round(sleep % 60)}d` : '—'}
          hint={sleep != null ? 'saatten' : 'kayıt yok'}
        />
        <Stat label="Nabız" value={hr != null ? `${Math.round(hr)}` : '—'} hint={hr != null ? 'dinlenme' : 'kayıt yok'} />
      </div>
    </div>
  )
}
