import { useLiveQuery } from 'dexie-react-hooks'

import { lastDates } from '../lib/date'
import { db } from '../lib/db'
import { dayAverage, movingAverage, weightDelta } from '../lib/metrics'
import { useGoals } from '../lib/settings'
import { groupsFor, useSplit, useSplitNotes } from '../lib/split'

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
 * Gunun ust serildi: yalniz okunur "glance" - sol kilo trendi, ortada protein
 * halkasi, sagda bugunun antrenmani. Giris alani yok (alt sayfaya tasindi).
 * Altindaki bilgi kartlari yalniz verisi olanlar icin cizilir.
 */
export function DayHeader({ date }: { date: string }) {
  const goals = useGoals()
  const split = useSplit()
  const splitNotes = useSplitNotes()
  const log = useLiveQuery(() => db.daily_log.get(date), [date])
  const workouts = useLiveQuery(() => db.workout.where('date').equals(date).toArray(), [date]) ?? []
  const week = lastDates(7, new Date(`${date}T12:00:00`))
  const weekLogs =
    useLiveQuery(() => db.daily_log.where('date').between(week[0]!, week[6]!, true, true).toArray(), [date]) ?? []
  const wearable = useLiveQuery(() => db.wearable.where('date').equals(date).toArray(), [date]) ?? []

  const protein = log?.protein_g ?? 0
  const pct = Math.min(100, Math.round((protein / goals.protein_g) * 100))
  const planned = groupsFor(split, date)
  const [y, m, d] = date.split('-').map(Number)
  const note = splitNotes[new Date(y!, m! - 1, d!).getDay()]
  const logged = workouts.filter((w) => !w.needs_review && w.type !== 'rest').length
  const avg = movingAverage(weekLogs.map((l) => l.weight_kg))
  const delta = weightDelta(weekLogs)
  const sleep = dayAverage(wearable, 'sleep_min')
  const hr = dayAverage(wearable, 'resting_hr')
  const veg = log?.veg_servings

  const deltaTone = delta == null ? 'text-ink-faint' : delta < 0 ? 'text-work' : 'text-load'
  const stats = veg != null || sleep != null || hr != null

  return (
    <div className="space-y-3">
      <section className="glass-card grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wide text-ink-faint">7 gün ort.</div>
          <div className="text-lg font-bold tabular-nums">
            {avg != null ? `${avg.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg` : '—'}
          </div>
          <div className={`text-[10px] tabular-nums ${deltaTone}`}>
            {delta != null
              ? `${delta > 0 ? '+' : ''}${delta.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg/hf`
              : '—'}
          </div>
        </div>

        <div
          role="img"
          aria-label={`Protein ${protein} / ${goals.protein_g} gram`}
          className="flex size-[52px] items-center justify-center rounded-full"
          style={{ background: `conic-gradient(var(--color-a1) ${pct}%, var(--color-glass-inset) 0)` }}
        >
          <div className="flex size-10 items-center justify-center rounded-full bg-solid text-[9px] font-bold tabular-nums">
            {protein}/{goals.protein_g}
          </div>
        </div>

        <div className="min-w-0 text-right">
          <div className="text-[10px] uppercase tracking-wide text-ink-faint">Bugün</div>
          <div className="truncate text-[13px] font-bold">{planned.length > 0 ? planned.join(', ') : 'Dinlenme'}</div>
          <div className="text-[10px] tabular-nums text-ink-faint">{logged} kayıt</div>
        </div>
      </section>

      {note && <p className="glass-card px-4 py-2 text-[12px] text-ink-faint">{note}</p>}

      {stats && (
        <div className="flex gap-3">
          {veg != null && <Stat label="Sebze" value={`${veg}/5`} hint="porsiyon" />}
          {sleep != null && (
            <Stat label="Uyku" value={`${Math.floor(sleep / 60)}s ${Math.round(sleep % 60)}d`} hint="saatten" />
          )}
          {hr != null && <Stat label="Nabız" value={`${Math.round(hr)}`} hint="dinlenme" />}
        </div>
      )}
    </div>
  )
}
