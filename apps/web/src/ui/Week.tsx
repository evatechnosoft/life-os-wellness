import { useLiveQuery } from 'dexie-react-hooks'

import { lastDates, toLocalDate } from '../lib/date'
import { db } from '../lib/db'
import { volumeTips } from '../lib/coach'
import { tipText } from '../lib/coachText'
import { adherencePct, dayAverage, movingAverage, setsByMuscle, streak, weightDelta } from '../lib/metrics'
import { useGoals } from '../lib/settings'
import { useSplit } from '../lib/split'
import { Card } from './Field'

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

const PAD = { left: 4, right: 34, top: 10, bottom: 8 }

/** 7-gun hareketli ortalama kilo. Inline SVG: grafik icin paket eklemeye deger bir is degil. */
function Sparkline({ points }: { points: (number | null)[] }) {
  const known = points.filter((p): p is number => p != null)
  if (known.length < 2) return <p className="text-xs text-ink-faint">Yeterli veri yok.</p>

  const min = Math.min(...known)
  const max = Math.max(...known)
  const span = max - min || 1
  const width = 200 - PAD.left - PAD.right
  const height = 60 - PAD.top - PAD.bottom
  const base = 60 - PAD.bottom
  const x = (i: number) => PAD.left + (points.length > 1 ? (i / (points.length - 1)) * width : width / 2)
  const y = (v: number) => PAD.top + (1 - (v - min) / span) * height

  const drawn = points.flatMap((p, i) => (p == null ? [] : [{ i, v: p }]))
  const line = drawn.map((d, n) => `${n === 0 ? 'M' : 'L'}${x(d.i).toFixed(1)},${y(d.v).toFixed(1)}`).join(' ')
  const first = drawn[0]!
  const last = drawn[drawn.length - 1]!
  const area = `${line} L${x(last.i).toFixed(1)},${base} L${x(first.i).toFixed(1)},${base} Z`
  const peak = drawn.reduce((best, d) => (d.v > best.v ? d : best), first)

  return (
    <svg viewBox="0 0 200 60" width="100%" className="mt-2 block" role="img" aria-label="Kilo egrisi">
      <defs>
        <linearGradient id="wk-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((t) => (
        <line key={t} x1={PAD.left} x2={200 - PAD.right} y1={PAD.top + t * height} y2={PAD.top + t * height} stroke="rgba(255,255,255,.07)" strokeWidth="1" />
      ))}
      <path d={area} fill="url(#wk-area)" />
      <path d={line} stroke="#2dd4bf" strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(last.i)} cy={y(last.v)} r="6" fill="none" stroke="#2dd4bf" strokeOpacity=".4" />
      <circle cx={x(last.i)} cy={y(last.v)} r="3.5" fill="#2dd4bf" />
      <text x={PAD.left} y={PAD.top - 3} fontSize="7" fill="rgba(244,246,251,.38)">
        {nf1.format(peak.v)}
      </text>
      <text x={x(last.i) + 8} y={y(last.v) + 2.5} fontSize="7" fill="#2dd4bf">
        {nf1.format(last.v)}
      </text>
    </svg>
  )
}

export function Week() {
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
            <div key={d} className="flex flex-col items-center gap-1">
              <span className="text-[9px] text-ink-faint">{abbr}</span>
              <span className={`flex h-[26px] w-[26px] items-center justify-center rounded-full text-[10px] tabular-nums ${fill}`}>
                {dom}
              </span>
            </div>
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
        <Sparkline points={trend} />
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
            <div key={d} className="flex justify-between px-3 py-1.5 text-[11px]">
              <span className={d === today ? 'text-a1' : 'text-ink-dim'}>
                {abbr} {dom}
              </span>
              <span className="tabular-nums text-ink-dim">{parts.length === 0 ? '—' : parts.join(' · ')}</span>
            </div>
          )
        })}
      </div>

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
