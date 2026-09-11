import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'

import { getApiBase, getToken, setApiBase, setToken } from '../lib/api'
import { db } from '../lib/db'
import { saveGoals, useGoals } from '../lib/settings'
import { saveSplit, useSplit, WEEKDAYS } from '../lib/split'
import { syncOutbox } from '../lib/store'
import { Card, NumberField } from './Field'

function NoteHistory() {
  const notes = useLiveQuery(() => db.note_log.orderBy('id').reverse().limit(40).toArray(), []) ?? []
  if (notes.length === 0) return <p className="text-xs text-ink-faint">Henüz not yok.</p>
  return (
    <ul className="space-y-3">
      {notes.map((n) => (
        <li key={n.id} className="border-l-2 border-edge-soft pl-3">
          <div className="text-xs text-ink-faint">
            {n.date} {n.at} · {n.via === 'voice' ? 'sesli' : 'yazılı'}
          </div>
          <p className="text-sm text-ink-dim">{n.text}</p>
          {n.applied.length > 0 && (
            <p className="mt-0.5 text-xs text-a1">{n.applied.join(' · ')}</p>
          )}
        </li>
      ))}
    </ul>
  )
}

const MUSCLES = ['göğüs', 'sırt', 'bacak', 'omuz', 'kol', 'karın']

/** Haftalik program: hangi gun hangi bolge. Eva bugunun bolgesini bilir ve takip eder. */
function SplitEditor() {
  const split = useSplit()
  const toggle = (weekday: number, muscle: string) => {
    const current = split[weekday] ?? []
    const next = current.includes(muscle) ? current.filter((m) => m !== muscle) : [...current, muscle]
    void saveSplit({ ...split, [weekday]: next })
  }
  // Hafta pazartesiden okunur; getDay() pazari 0 verdigi icin sira boyle diziliyor.
  const order = [1, 2, 3, 4, 5, 6, 0]

  return (
    <ul className="space-y-3">
      {order.map((weekday) => (
        <li key={weekday}>
          <div className="text-xs text-ink-faint">{WEEKDAYS[weekday]}</div>
          <div className="mt-1 flex flex-wrap gap-2">
            {MUSCLES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => toggle(weekday, m)}
                aria-pressed={(split[weekday] ?? []).includes(m)}
                className={`min-h-11 rounded-full px-4 text-xs ${
                  (split[weekday] ?? []).includes(m) ? 'bg-a1/90 text-solid' : 'bg-glass-inset text-ink-faint'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </li>
      ))}
    </ul>
  )
}

export function Settings() {
  const goals = useGoals()
  const pending = useLiveQuery(() => db.outbox.count(), []) ?? 0
  const [token, setLocalToken] = useState(getToken())
  const [base, setLocalBase] = useState(getApiBase())
  const [status, setStatus] = useState('')

  const exportJson = async () => {
    const [daily_log, workout, retro, notes, wearable, meal, chat] = await Promise.all([
      db.daily_log.toArray(),
      db.workout.toArray(),
      db.retro.toArray(),
      db.note_log.toArray(),
      db.wearable.toArray(),
      db.meal.toArray(),
      db.chat.toArray(),
    ])
    // Fotograflar Blob; JSON'a giremez, yerine boyutu yaziliyor.
    const meals = meal.map(({ photo, ...rest }) => ({ ...rest, photo_bytes: photo instanceof Blob ? photo.size : 0 }))
    const blob = new Blob(
      [JSON.stringify({ exported_at: new Date().toISOString(), daily_log, workout, retro, notes, wearable, meals, chat }, null, 2)],
      { type: 'application/json' },
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wellness-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <Card title="Sunucu">
        <label className="block text-sm text-ink-dim">Sunucu adresi</label>
        <input
          type="url"
          inputMode="url"
          value={base}
          onChange={(e) => setLocalBase(e.target.value)}
          onBlur={() => setApiBase(base)}
          placeholder="https://fit.evaitec.com"
          className="mt-2 w-full rounded-field bg-glass-inset px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-a1"
        />
        <p className="mt-1 text-xs text-ink-faint">
          Boş bırakırsan varsayılan kullanılır. Ev ağındayken http://192.168.1.185:3011 gibi bir adres daha hızlıdır.
        </p>
        <label className="mt-4 block text-sm text-ink-dim">API token</label>
        <input
          type="password"
          value={token}
          onChange={(e) => setLocalToken(e.target.value)}
          onBlur={() => setToken(token)}
          placeholder=".env icindeki API_TOKEN"
          className="mt-2 w-full rounded-field bg-glass-inset px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-a1"
        />
        <div className="mt-3 flex items-center justify-between text-xs text-ink-faint">
          <span>{pending === 0 ? 'kuyruk boş' : `${pending} kayıt gönderilmeyi bekliyor`}</span>
          <button
            type="button"
            onClick={async () => {
              const sent = await syncOutbox()
              setStatus(sent > 0 ? `${sent} kayıt gönderildi` : pending > 0 ? 'gönderilemedi' : 'gönderilecek kayıt yok')
            }}
            className="rounded-field bg-glass-strong px-3 py-2 text-ink-dim"
          >
            Şimdi senkronla
          </button>
        </div>
        {status && <p className="mt-2 text-xs text-ink-faint">{status}</p>}
      </Card>

      <Card title="Hedefler">
        <NumberField label="Günlük protein" unit="g" value={goals.protein_g} onCommit={(v) => void saveGoals({ ...goals, protein_g: v ?? 140 })} />
        <NumberField label="Haftalık kilo kaybı" unit="kg" step={0.05} value={goals.weekly_weight_loss_kg} onCommit={(v) => void saveGoals({ ...goals, weekly_weight_loss_kg: v ?? 0.6 })} />
        <NumberField label="Kas grubu başına set" value={goals.sets_per_group} onCommit={(v) => void saveGoals({ ...goals, sets_per_group: v ?? 10 })} />
      </Card>

      <Card title="Haftalık program">
        <p className="mb-3 text-xs text-ink-faint">
          Hangi gün hangi bölge. Eva bugünün bölgesini bilir, o güne ait kaydı takip eder.
        </p>
        <SplitEditor />
      </Card>

      <Card title="Notlar">
        <NoteHistory />
      </Card>

      <Card title="Veri">
        <button type="button" onClick={() => void exportJson()} className="w-full rounded-field bg-glass-strong py-3 text-sm active:bg-glass-strong">
          JSON olarak dışa aktar
        </button>
      </Card>
    </div>
  )
}
