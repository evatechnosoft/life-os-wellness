import { useLiveQuery } from 'dexie-react-hooks'

import { lastDates, toLocalDate } from '../lib/date'
import { db } from '../lib/db'
import { volumeTips } from '../lib/coach'
import { tipText } from '../lib/coachText'
import { adherencePct, dayAverage, kcalDayAverage, movingAverage, setsByMuscle, streak, weightDelta } from '../lib/metrics'
import { useGoals } from '../lib/settings'
import { useSplit } from '../lib/split'
import { BodyReport } from './Body'
import { Card } from './Field'
import { Sparkline } from './Sparkline'

/** Indexed by JS getDay(): 0 = Sunday. */
const DAY_ABBR = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']

/** Local day-of-week and day-of-month from YYYY-MM-DD. No toISOString(): it is UTC and shifts the day. */
function dayParts(date: string): { abbr: string; dom: number } {
  const [year, month, day] = date.split('-').map(Number)
  const d = new Date(year!, month! - 1, day!)
  return { abbr: DAY_ABBR[d.getDay()]!, dom: d.getDate() }
}

/** Trailing `window`-day mean for every position. Missing days are skipped, not zeroed. */
function trailingAverage(values: (number | null | undefined)[], window: number): (number | null)[] {
  return values.map((_, i) => movingAverage(values.slice(Math.max(0, i - window + 1), i + 1)))
}

const nf1 = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/** onPickDay: bir gune dokununca o gun Bugun ekraninda acilir (duzeltme/ekleme). */
export function Week({ onPickDay }: { onPickDay?: (date: string) => void } = {}) {
  const goals = useGoals()
  const split = useSplit()
  const dates = lastDates(7)
  const start = dates[0]!
  const end = dates[dates.length - 1]!
  const today = toLocalDate()

  // Hareketli ortalama ve seri 7 gunden uzun pencere ister: egri tek noktaya dusmesin.
  const trendDates = lastDates(28)
  const trendStart = trendDates[0]!

  const logs = useLiveQuery(() => db.daily_log.where('date').between(start, end, true, true).toArray(), [start, end]) ?? []
  const trendLogs = useLiveQuery(() => db.daily_log.where('date').between(trendStart, end, true, true).toArray(), [trendStart, end]) ?? []
  const workouts = useLiveQuery(() => db.workout.where('date').between(start, end, true, true).toArray(), [start, end]) ?? []
  const wearable = useLiveQuery(() => db.wearable.where('date').between(start, end, true, true).toArray(), [start, end]) ?? []
  const meals = useLiveQuery(() => db.meal.where('date').between(start, end, true, true).toArray(), [start, end]) ?? []
  // Kalori ortalamasi bugunu almaz: yarim gun ortalamayi asagi ceker, uyari gec gelir.
  const kcalDates = lastDates(8).slice(0, -1)
  const kcalStart = kcalDates[0]!
  const kcalEnd = kcalDates[kcalDates.length - 1]!
  const kcalMeals = useLiveQuery(() => db.meal.where('date').between(kcalStart, kcalEnd, true, true).toArray(), [kcalStart, kcalEnd]) ?? []
  const kcalAvg = kcalDayAverage(kcalMeals)
  const kcalMax = goals.kcal_week_max
  const kcalOver = kcalAvg != null && kcalMax != null && kcalAvg > kcalMax

  const byDate = new Map(logs.map((l) => [l.date, l]))
  const trendByDate = new Map(trendLogs.map((l) => [l.date, l]))
  const workoutsByDate = new Map<string, string[]>()
  for (const w of workouts) {
    if (w.muscle_groups.length === 0) continue
    workoutsByDate.set(w.date, [...(workoutsByDate.get(w.date) ?? []), ...w.muscle_groups])
  }

  const trend = trailingAverage(trendDates.map((d) => trendByDate.get(d)?.weight_kg), 7)
  const avg = movingAverage(dates.map((d) => byDate.get(d)?.weight_kg))
  const delta = weightDelta(logs)
  const logged = new Set(trendLogs.filter((l) => l.protein_g != null || l.weight_kg != null).map((l) => l.date))
  const hitDays = dates.filter((d) => (byDate.get(d)?.protein_g ?? 0) >= goals.protein_g).length
  const sets = setsByMuscle(workouts)
  const steps = logs.reduce((sum, l) => sum + (l.steps ?? 0), 0)
  // Ust sinir coach.ts ile ayni: hedef ile 20 setin buyugu.
  const cap = Math.max(goals.sets_per_group, 20)
  const volume = volumeTips(workouts, goals, split).slice(0, 3)
  // Diyet katmani (PLAN-DIET S3/S4): bel, sebze ortalamasi, cok ac karnina yenen ogun.
  const waist = logs.filter((l) => l.waist_cm != null).at(-1)?.waist_cm ?? null
  const vegAvg = movingAverage(logs.map((l) => l.veg_servings))
  const highHunger = meals.filter((m) => (m.hunger ?? 0) >= 8).length
  const restingHr = dayAverage(wearable, 'resting_hr')
  const kcal = dayAverage(wearable, 'total_kcal')

  return (
    <div>
      <div className="mt-3 grid grid-cols-7 gap-1">
        {dates.map((d) => {
          const { abbr, dom } = dayParts(d)
          const hit = (byDate.get(d)?.protein_g ?? 0) >= goals.protein_g
          const fill = hit ? 'bg-work text-solid' : d === today ? 'border border-a1 text-a1' : 'bg-glass-inset text-ink-dim'
          return (
            <button type="button" key={d} aria-label={`${d} gününü aç`} onClick={() => onPickDay?.(d)}
              className="flex min-h-11 flex-col items-center gap-1">
              <span className="text-[9px] text-ink-faint">{abbr}</span>
              <span className={`flex h-[26px] w-[26px] items-center justify-center rounded-full text-[10px] tabular-nums ${fill}`}>
                {dom}
              </span>
            </button>
          )
        })}
      </div>

      <section className="glass-card mt-3 p-3">
        <h2 className="text-[10px] uppercase tracking-wide text-ink-faint">7 gün hareketli ortalama · kg</h2>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-lg font-bold tabular-nums">{avg == null ? '—' : nf1.format(avg)}</span>
          {delta != null && (
            <span className={`text-[11px] tabular-nums ${delta <= 0 ? 'text-a1' : 'text-a3'}`}>
              {delta > 0 ? '+' : ''}{nf1.format(delta)} kg
            </span>
          )}
        </div>
        <Sparkline points={trend} label="Kilo eğrisi" />
      </section>

      <section className="glass-card mt-2 p-3">
        <h2 className="text-[10px] uppercase tracking-wide text-ink-faint">Kalori · son 7 gün ortalaması</h2>
        <div className="mt-1 flex items-baseline gap-2">
          <span className={`text-lg font-bold tabular-nums ${kcalOver ? 'text-a3' : ''}`}>
            {kcalAvg == null ? '—' : kcalAvg.toLocaleString('tr-TR')}
          </span>
          {kcalMax != null && <span className="text-[11px] text-ink-faint">sınır {kcalMax.toLocaleString('tr-TR')}</span>}
        </div>
        {kcalOver && (
          <p className="mt-1 text-[11px] text-a3">
            Haftalık ortalama sınırın {(kcalAvg - kcalMax).toLocaleString('tr-TR')} kcal üstünde.
          </p>
        )}
      </section>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="glass-card p-3">
          <h2 className="text-[10px] uppercase tracking-wide text-ink-faint">Protein uyumu</h2>
          <div className="text-lg font-bold tabular-nums">%{adherencePct(logs, dates, goals.protein_g)}</div>
          <p className="text-[11px] text-ink-faint">
            {hitDays}/{dates.length} gün hedefte
          </p>
        </div>
        <div className="glass-card p-3">
          <h2 className="text-[10px] uppercase tracking-wide text-ink-faint">Seri</h2>
          <div className="text-lg font-bold tabular-nums">{streak(logged, trendDates)} gün</div>
          <p className="text-[11px] text-ink-faint">arka arkaya kayıt</p>
        </div>
      </div>

      <div className="glass-card mt-2 py-1">
        {dates.map((d) => {
          const { abbr, dom } = dayParts(d)
          const log = byDate.get(d)
          const groups = workoutsByDate.get(d) ?? []
          const parts = [
            log?.weight_kg == null ? null : nf1.format(log.weight_kg),
            log?.protein_g == null ? null : `${log.protein_g} g`,
            groups.length > 0 ? [...new Set(groups)].join(', ') : null,
          ].filter((p): p is string => p != null)
          return (
            <button type="button" key={d} onClick={() => onPickDay?.(d)}
              className="flex min-h-9 w-full justify-between px-3 py-1.5 text-left text-[11px] active:bg-glass">
              <span className={d === today ? 'text-a1' : 'text-ink-dim'}>
                {abbr} {dom}
              </span>
              <span className="tabular-nums text-ink-dim">{parts.length === 0 ? '—' : parts.join(' · ')}</span>
            </button>
          )
        })}
      </div>

      <BodyReport />

      <Card id="week-sets" title="Haftalık set — kas grubu" collapsible summary={`${Object.keys(sets).length} grup`}>
        {Object.keys(sets).length === 0 ? (
          <p className="py-2 text-xs text-ink-faint">Bu hafta direnç antrenmanı kaydı yok.</p>
        ) : (
          <ul className="space-y-2">
            {Object.entries(sets).sort((a, b) => b[1] - a[1]).map(([group, total]) => (
              <li key={group} className="flex items-center gap-3 text-sm">
                <span className="w-16 text-ink-dim">{group}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-glass-strong">
                  <span
                    className={`block h-full ${total >= goals.sets_per_group && total <= cap ? 'bg-a1' : 'bg-ink-faint'}`}
                    style={{ width: `${Math.min(100, (total / cap) * 100)}%` }}
                  />
                </span>
                <span className="w-14 text-right tabular-nums text-ink-dim">
                  {total}/{goals.sets_per_group}
                </span>
              </li>
            ))}
          </ul>
        )}
        {volume.length > 0 && (
          <ul className="mt-3 space-y-1">
            {volume.map((tip) => (
              <li key={`${tip.kind}:${'muscle' in tip ? tip.muscle : ''}`} className="flex gap-2 text-xs text-ink-faint">
                <span aria-hidden className={tip.severity === 'warn' ? 'text-a2' : 'text-a1'}>
                  •
                </span>
                <span>{tipText(tip)}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-ink-faint">
          Hedef: grup başına {goals.sets_per_group} set, üst sınır {cap}.
        </p>
      </Card>

      <Card id="week-diet" title="Beslenme" collapsible summary={waist == null ? 'bel —' : `bel ${nf1.format(waist)}`}>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-2xl font-semibold tabular-nums">{waist == null ? '—' : nf1.format(waist)}</div>
            <div className="text-xs text-ink-faint">bel cm</div>
          </div>
          <div>
            <div className="text-2xl font-semibold tabular-nums">{vegAvg == null ? '—' : nf1.format(vegAvg)}</div>
            <div className="text-xs text-ink-faint">sebze ort.</div>
          </div>
          <div>
            <div className="text-2xl font-semibold tabular-nums">{highHunger}</div>
            <div className="text-xs text-ink-faint">8+ açlıkla öğün</div>
          </div>
        </div>
        <p className="mt-3 text-xs text-ink-faint">
          Sebze hedefi günde 5 porsiyon. Bel, kilo durduğunda ilerlemeyi gösteren ikinci ölçüdür.
        </p>
      </Card>

      <Card id="week-watch" title="Saatten gelen" collapsible summary={`${steps.toLocaleString('tr-TR')} adım`}>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-2xl font-semibold tabular-nums">{steps.toLocaleString('tr-TR')}</div>
            <div className="text-xs text-ink-faint">toplam adım</div>
          </div>
          <div>
            <div className="text-2xl font-semibold tabular-nums">{restingHr ?? '—'}</div>
            <div className="text-xs text-ink-faint">dinlenme nabzı</div>
          </div>
          <div>
            <div className="text-2xl font-semibold tabular-nums">{kcal?.toLocaleString('tr-TR') ?? '—'}</div>
            <div className="text-xs text-ink-faint">günlük kcal</div>
          </div>
        </div>
      </Card>
    </div>
  )
}
