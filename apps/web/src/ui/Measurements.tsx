import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'

import { db } from '../lib/db'
import { dayValue, summary } from '../lib/measurements'
import { deleteMeasurement, saveMeasurement } from '../lib/store'

/**
 * Gun ici olcum defteri. daily_log gunde tek deger tutuyordu; 23 Eyl'de ayni gun
 * alinan uc tansiyondan ikisi 6 dakika arayla 134/90 ve 128/78 cikinca ust uste
 * yazildi. Artik her olcum saatiyle duruyor, gunun degeri sabah olcumlerinin
 * ortalamasi (lib/measurements.ts) ve daily_log'a o yaziliyor.
 *
 * Giris 60 sn kuralinda: saat otomatik, dort alan da opsiyonel, tek dugme.
 */
export function Measurements({ date }: { date: string }) {
  const rows = useLiveQuery(
    () => db.measurement.where('date').equals(date).toArray(),
    [date],
  ) ?? []
  const sorted = [...rows].sort((a, b) => a.time.localeCompare(b.time))
  const value = dayValue(sorted)

  const [sys, setSys] = useState('')
  const [dia, setDia] = useState('')
  const [pulse, setPulse] = useState('')
  const [weight, setWeight] = useState('')
  const [busy, setBusy] = useState(false)

  const num = (text: string): number | null => {
    const n = Number(text.replace(',', '.'))
    return text.trim() !== '' && Number.isFinite(n) ? n : null
  }

  const add = async () => {
    const row = {
      id: crypto.randomUUID(),
      date,
      // Olcumun saati simdi: kullanicidan istemek 60 sn kuralini bozar, duzeltmek
      // isteyen satiri silip yeniden ekler.
      time: new Date().toTimeString().slice(0, 5),
      bp_systolic: num(sys),
      bp_diastolic: num(dia),
      pulse: num(pulse),
      weight_kg: num(weight),
      note: null,
    }
    if (row.bp_systolic == null && row.bp_diastolic == null && row.pulse == null && row.weight_kg == null) return
    setBusy(true)
    try {
      await saveMeasurement(row)
      setSys('')
      setDia('')
      setPulse('')
      setWeight('')
    } finally {
      setBusy(false)
    }
  }

  const field = (label: string, v: string, on: (s: string) => void, step = '1') => (
    <label className="flex-1">
      <span className="block text-xs text-ink-faint">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        step={step}
        value={v}
        onChange={(e) => on(e.target.value)}
        className="mt-1 min-h-11 w-full rounded-field bg-glass-inset px-2 py-2 text-center text-sm outline-none focus:ring-2 focus:ring-a1"
      />
    </label>
  )

  return (
    <div>
      <p className="text-xs text-ink-faint">{summary(value)}</p>

      <div className="mt-3 flex gap-2">
        {field('büyük', sys, setSys)}
        {field('küçük', dia, setDia)}
        {field('nabız', pulse, setPulse)}
        {field('kilo', weight, setWeight, '0.1')}
      </div>

      <button
        type="button"
        onClick={() => void add()}
        disabled={busy}
        className="mt-3 w-full rounded-field bg-glass-strong py-3 text-sm disabled:opacity-50"
      >
        {busy ? 'Kaydediliyor…' : 'Ölçümü ekle'}
      </button>

      {sorted.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-ink-dim">
          {sorted.map((r) => (
            <li key={r.id} className="flex items-center justify-between rounded-field bg-glass-inset px-3 py-2">
              <span>
                <b className="text-ink">{r.time}</b>{' '}
                {r.bp_systolic != null && `${r.bp_systolic}/${r.bp_diastolic ?? '—'}`}
                {r.pulse != null && ` · ${r.pulse} bpm`}
                {r.weight_kg != null && ` · ${r.weight_kg} kg`}
                {r.time <= '11:00' && <span className="ml-2 text-ink-faint">sabah</span>}
              </span>
              <button
                type="button"
                onClick={() => void deleteMeasurement(r.id)}
                aria-label="ölçümü sil"
                className="min-h-11 px-3 text-ink-faint"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
