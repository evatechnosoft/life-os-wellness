import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'

import { db } from '../lib/db'
import { isNative } from '../lib/health'
import { sleepStatus, startSleep, stopSleep, type SleepStatus, type SleepSummary } from '../lib/sleep'
import { Card } from './Field'

const METRICS: { metric: string; label: string; unit: string }[] = [
  { metric: 'sleep_monitored_min', label: 'İzlenen süre', unit: 'dk' },
  { metric: 'snore_min', label: 'Horlama (tahmini)', unit: 'dk' },
  { metric: 'snore_episodes', label: 'Horlama epizodu', unit: '' },
  { metric: 'longest_pause_sec', label: 'En uzun duraklama', unit: 'sn' },
]

function Summary({ values }: { values: Map<string, number> }) {
  const pause = values.get('longest_pause_sec') ?? 0
  return (
    <div>
      <ul className="space-y-1">
        {METRICS.filter((m) => values.has(m.metric)).map((m) => (
          <li key={m.metric} className="flex justify-between text-sm">
            <span className="text-ink-dim">{m.label}</span>
            <span className="tabular-nums">
              {Math.round(values.get(m.metric)!)} {m.unit}
            </span>
          </li>
        ))}
      </ul>
      {pause >= 10 && (
        <p className="mt-3 text-xs text-a3">
          Horlamadan sonra {Math.round(pause)} sn sessizlik ölçüldü. Bu bir tanı değil, yalnız
          bir işaret — tekrar ediyorsa hekime göstermeye değer.
        </p>
      )}
    </div>
  )
}

export function Sleep({ date }: { date: string }) {
  const [status, setStatus] = useState<SleepStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [justStopped, setJustStopped] = useState<SleepSummary | null>(null)
  const stored = useLiveQuery(() => db.wearable.where('date').equals(date).toArray(), [date]) ?? []

  useEffect(() => {
    if (!isNative()) return
    void sleepStatus().then(setStatus).catch(() => {})
  }, [])

  if (!isNative()) {
    return (
      <Card title="Uyku (telefon)">
        <p className="text-xs text-ink-faint">
          Gece ölçümü yalnız Android uygulamasında çalışır — tarayıcı sekmesi ekran kapanınca
          askıya alınır, mikrofonu gece boyu dinleyemez.
        </p>
      </Card>
    )
  }

  const values = new Map(stored.filter((r) => r.source === 'phone_mic').map((r) => [r.metric, r.value]))

  const toggle = async () => {
    setBusy(true)
    try {
      if (status?.running) {
        setJustStopped(await stopSleep())
      } else {
        await startSleep()
      }
      setStatus(await sleepStatus())
    } catch (err) {
      setStatus((s) => (s ? { ...s, error: String(err) } : s))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card title="Uyku (telefon)">
      {status?.running ? (
        <p className="text-sm text-ink-dim">
          Dinleniyor — {Math.round((status.periodMs ?? 30000) / 1000)} saniyede bir{' '}
          {Math.round((status.listenMs ?? 4000) / 1000)} saniye. Ses kaydedilmiyor.
        </p>
      ) : justStopped ? (
        <Summary values={new Map(Object.entries({
          sleep_monitored_min: justStopped.monitoredMin,
          snore_min: justStopped.snoreMin,
          snore_episodes: justStopped.snoreEpisodes,
          longest_pause_sec: justStopped.longestPauseSec,
        }))} />
      ) : values.size > 0 ? (
        <Summary values={values} />
      ) : (
        <p className="text-xs text-ink-faint">
          Saat takmadığın gecelerde telefonu başucuna koy ve başlat. Mikrofon aralıklı dinler,
          yalnız horlama sayıları saklanır — ses ne kaydedilir ne de gönderilir.
        </p>
      )}

      {status?.error && <p className="mt-2 text-xs text-a3">{status.error}</p>}

      <button
        type="button"
        onClick={() => void toggle()}
        disabled={busy}
        className={`mt-3 w-full rounded-field py-3 text-sm font-medium disabled:opacity-50 ${
          status?.running ? 'bg-glass-strong' : 'bg-a1/90 active:bg-a1'
        }`}
      >
        {busy ? '…' : status?.running ? 'Durdur ve özetle' : 'Gece ölçümünü başlat'}
      </button>
    </Card>
  )
}
