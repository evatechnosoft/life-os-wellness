import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'

import { getToken, setToken } from '../lib/api'
import { db } from '../lib/db'
import { saveGoals, useGoals } from '../lib/settings'
import { syncOutbox } from '../lib/store'
import { Card, NumberField } from './Field'

export function Settings() {
  const goals = useGoals()
  const pending = useLiveQuery(() => db.outbox.count(), []) ?? 0
  const [token, setLocalToken] = useState(getToken())
  const [status, setStatus] = useState('')

  const exportJson = async () => {
    const [daily_log, workout, retro] = await Promise.all([
      db.daily_log.toArray(),
      db.workout.toArray(),
      db.retro.toArray(),
    ])
    const blob = new Blob([JSON.stringify({ exported_at: new Date().toISOString(), daily_log, workout, retro }, null, 2)], {
      type: 'application/json',
    })
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
        <label className="block text-sm text-slate-400">API token</label>
        <input
          type="password"
          value={token}
          onChange={(e) => setLocalToken(e.target.value)}
          onBlur={() => setToken(token)}
          placeholder=".env icindeki API_TOKEN"
          className="mt-2 w-full rounded-lg bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
        />
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span>{pending === 0 ? 'kuyruk boş' : `${pending} kayıt gönderilmeyi bekliyor`}</span>
          <button
            type="button"
            onClick={async () => {
              const sent = await syncOutbox()
              setStatus(sent > 0 ? `${sent} kayıt gönderildi` : pending > 0 ? 'gönderilemedi' : 'gönderilecek kayıt yok')
            }}
            className="rounded-lg bg-slate-800 px-3 py-2 text-slate-300"
          >
            Şimdi senkronla
          </button>
        </div>
        {status && <p className="mt-2 text-xs text-slate-500">{status}</p>}
      </Card>

      <Card title="Hedefler">
        <NumberField label="Günlük protein" unit="g" value={goals.protein_g} onCommit={(v) => void saveGoals({ ...goals, protein_g: v ?? 140 })} />
        <NumberField label="Haftalık kilo kaybı" unit="kg" step={0.05} value={goals.weekly_weight_loss_kg} onCommit={(v) => void saveGoals({ ...goals, weekly_weight_loss_kg: v ?? 0.6 })} />
        <NumberField label="Kas grubu başına set" value={goals.sets_per_group} onCommit={(v) => void saveGoals({ ...goals, sets_per_group: v ?? 10 })} />
      </Card>

      <Card title="Veri">
        <button type="button" onClick={() => void exportJson()} className="w-full rounded-lg bg-slate-800 py-3 text-sm active:bg-slate-700">
          JSON olarak dışa aktar
        </button>
      </Card>
    </div>
  )
}
