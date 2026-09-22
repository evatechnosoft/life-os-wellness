import { useState } from 'react'

import { toLocalDate } from '../lib/date'
import { WEEKDAYS } from '../lib/split'
import { DAY_TYPE_LABEL, saveDay, useWorkoutPlan, type DayType } from '../lib/workoutPlan'

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
  const today = new Date(toLocalDate() + 'T00:00:00').getDay()

  const pick = (weekday: number, day_type: DayType) => {
    setSaving(weekday)
    void saveDay({ weekday, day_type }).finally(() => setSaving(null))
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
          <div key={weekday}
            className={`flex items-center justify-between rounded-card px-4 py-3 ${isToday ? 'bg-glass-strong' : 'bg-glass'}`}>
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
        )
      })}

      <p className="px-1 text-xs text-ink-faint">
        Zar (haftayı kur) ve kas haritasından hareket seçimi sıradaki adımda.
      </p>
    </section>
  )
}
