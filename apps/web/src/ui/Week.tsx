import { useLiveQuery } from 'dexie-react-hooks'

import { lastDates } from '../lib/date'
import { db } from '../lib/db'
import { adherencePct, movingAverage, setsByMuscle, streak, weightDelta } from '../lib/metrics'
import { useGoals } from '../lib/settings'
import { Card } from './Field'

function Sparkline({ points }: { points: (number | null)[] }) {
  const known = points.filter((p): p is number => p != null)
  if (known.length < 2) return <p className="py-6 text-center text-xs text-ink-faint">Grafik için en az 2 tartı gerekli.</p>

  const min = Math.min(...known)
  const max = Math.max(...known)
  const span = max - min || 1
  const x = (i: number) => (i / (points.length - 1)) * 100
  const y = (v: number) => 30 - ((v - min) / span) * 26 - 2

  const path = points
    .map((p, i) => (p == null ? null : `${x(i).toFixed(1)},${y(p).toFixed(1)}`))
    .filter((p): p is string => p !== null)
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p}`)
    .join(' ')

  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="mt-2 h-20 w-full">
      <path d={path} fill="none" stroke="#2dd4bf" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      {points.map((p, i) => p != null && <circle key={i} cx={x(i)} cy={y(p)} r="0.9" fill="rgba(244,246,251,0.38)" />)}
    </svg>
  )
}

export function Week() {
  const goals = useGoals()
  const dates = lastDates(7)
  const start = dates[0]!
  const end = dates[dates.length - 1]!

  const logs = useLiveQuery(() => db.daily_log.where('date').between(start, end, true, true).toArray(), [start, end]) ?? []
  const workouts = useLiveQuery(() => db.workout.where('date').between(start, end, true, true).toArray(), [start, end]) ?? []

  const byDate = new Map(logs.map((l) => [l.date, l]))
  const weights = dates.map((d) => byDate.get(d)?.weight_kg ?? null)
  const avg = movingAverage(weights)
  const delta = weightDelta(logs)
  const logged = new Set(logs.filter((l) => l.protein_g != null || l.weight_kg != null).map((l) => l.date))
  const sets = setsByMuscle(workouts)
  const steps = logs.reduce((sum, l) => sum + (l.steps ?? 0), 0)
  const workoutDays = new Set(workouts.filter((w) => w.type !== 'rest').map((w) => w.date)).size

  return (
    <div>
      <Card title="Kilo — 7 gün ortalaması">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-semibold tabular-nums">{avg == null ? '—' : avg.toFixed(1)}</span>
          <span className="text-sm text-ink-faint">kg</span>
          {delta != null && (
            <span className={`ml-auto text-sm tabular-nums ${delta <= 0 ? 'text-a1' : 'text-a3'}`}>
              {delta > 0 ? '+' : ''}{delta} kg
            </span>
          )}
        </div>
        <Sparkline points={weights} />
      </Card>

      <Card title="Uyum">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-2xl font-semibold tabular-nums">{adherencePct(logs, dates, goals.protein_g)}%</div>
            <div className="text-xs text-ink-faint">protein</div>
          </div>
          <div>
            <div className="text-2xl font-semibold tabular-nums">{streak(logged, dates)}</div>
            <div className="text-xs text-ink-faint">gün seri</div>
          </div>
          <div>
            <div className="text-2xl font-semibold tabular-nums">{workoutDays}</div>
            <div className="text-xs text-ink-faint">antrenman</div>
          </div>
        </div>
      </Card>

      <Card title="Haftalık set — kas grubu">
        {Object.keys(sets).length === 0 ? (
          <p className="py-2 text-xs text-ink-faint">Bu hafta direnç antrenmanı kaydı yok.</p>
        ) : (
          <ul className="space-y-2">
            {Object.entries(sets).sort((a, b) => b[1] - a[1]).map(([group, total]) => (
              <li key={group} className="flex items-center gap-3 text-sm">
                <span className="w-16 text-ink-dim">{group}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-glass-strong">
                  <span
                    className={`block h-full ${total >= 8 && total <= 12 ? 'bg-a1' : 'bg-ink-faint'}`}
                    style={{ width: `${Math.min(100, (total / 12) * 100)}%` }}
                  />
                </span>
                <span className="w-8 text-right tabular-nums text-ink-dim">{total}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-ink-faint">Hedef: grup başına {goals.sets_per_group} set (8-12 aralığı yeşil).</p>
      </Card>

      <Card title="Toplam adım">
        <div className="text-2xl font-semibold tabular-nums">{steps.toLocaleString('tr-TR')}</div>
      </Card>
    </div>
  )
}
