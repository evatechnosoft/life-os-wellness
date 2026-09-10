import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'

import { db } from '../lib/db'
import {
  healthStatus,
  installHealthConnect,
  isNative,
  openHealthConnect,
  requestHealthPermissions,
  syncHealth,
  type HealthStatus,
} from '../lib/health'
import { Card } from './Field'

const LABELS: Record<string, { label: string; unit: string }> = {
  steps: { label: 'Adım', unit: '' },
  active_kcal: { label: 'Aktif kalori', unit: 'kcal' },
  weight_kg: { label: 'Kilo', unit: 'kg' },
}

export function Watch({ date }: { date: string }) {
  const [status, setStatus] = useState<HealthStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const today = useLiveQuery(() => db.wearable.where('date').equals(date).toArray(), [date]) ?? []

  useEffect(() => {
    void healthStatus().then(setStatus)
  }, [])

  if (!isNative()) {
    return (
      <Card title="Saat">
        <p className="text-xs text-ink-faint">
          Saat verisi yalnız Android uygulamasında okunabilir — Health Connect web'e kapalı bir
          Android API'si. Tarayıcı sürümünde girişler manuel.
        </p>
      </Card>
    )
  }

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    try {
      await fn()
      setStatus(await healthStatus())
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card title="Saat">
      {status && !status.available && (
        <div>
          <p className="text-xs text-ink-dim">Health Connect kurulu değil.</p>
          <button type="button" onClick={() => void act(installHealthConnect)} className="mt-3 w-full rounded-field bg-glass-strong py-3 text-sm">
            Play Store'da aç
          </button>
        </div>
      )}

      {status?.available && !status.granted && (
        <div>
          <p className="text-xs text-ink-dim">Adım, kalori, kilo ve antrenman izni gerekiyor.</p>
          <button type="button" onClick={() => void act(requestHealthPermissions)} disabled={busy} className="mt-3 w-full rounded-field bg-a1/90 py-3 text-sm font-medium active:bg-a1 disabled:opacity-50">
            İzin ver
          </button>
        </div>
      )}

      {status?.granted && (
        <div>
          {today.length === 0 ? (
            <p className="text-xs text-ink-faint">Bugün için saatten veri gelmedi.</p>
          ) : (
            <ul className="space-y-1">
              {today.map((r) => (
                <li key={r.id} className="flex justify-between text-sm">
                  <span className="text-ink-dim">{LABELS[r.metric]?.label ?? r.metric}</span>
                  <span className="tabular-nums">
                    {Math.round(r.value).toLocaleString('tr-TR')} {LABELS[r.metric]?.unit ?? ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => void act(() => syncHealth())} disabled={busy} className="flex-1 rounded-field bg-glass-strong py-2.5 text-sm disabled:opacity-50">
              {busy ? 'Okunuyor…' : 'Şimdi oku'}
            </button>
            <button type="button" onClick={() => void act(openHealthConnect)} className="rounded-field bg-glass-inset px-4 text-xs text-ink-faint">
              İzinler
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}
