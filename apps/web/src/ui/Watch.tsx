import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'

import {
  activityStatus,
  disableActivity,
  enableActivity,
  syncActivity,
  type ActivityStatus,
} from '../lib/activity'
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
  total_kcal: { label: 'Toplam kalori', unit: 'kcal' },
  weight_kg: { label: 'Kilo', unit: 'kg' },
  protein_g: { label: 'Protein', unit: 'g' },
  resting_hr: { label: 'Dinlenme nabzı', unit: 'bpm' },
  spo2_pct: { label: 'Kan oksijeni', unit: '%' },
  spo2_low_pct: { label: 'En düşük oksijen', unit: '%' },
  hrv_ms: { label: 'HRV', unit: 'ms' },
  // Health Connect canli akis vermez; bu sayi nabzin ne kadar geriden geldigini
  // olcer - "canli nabiz" sanmamak icin ekranda duruyor.
  hr_lag_min: { label: 'Nabız gecikmesi', unit: 'dk' },
  bp_systolic: { label: 'Büyük tansiyon', unit: 'mmHg' },
  bp_diastolic: { label: 'Küçük tansiyon', unit: 'mmHg' },
  // Bu iki sayac "saat tekrar sayisini yaziyor mu" sorusunu tek bakista kapatir:
  // seans var + segment 0 ise cevap hayir (docs/SENSORS-FEASIBILITY.md 4.3).
  session_count: { label: 'Saatteki seans', unit: '' },
  segment_count: { label: 'Segment (tekrar dökümü)', unit: '' },
  sleep_min: { label: 'Uyku', unit: 'dk' },
  sleep_monitored_min: { label: 'Dinlenen süre', unit: 'dk' },
  snore_min: { label: 'Horlama', unit: 'dk' },
  snore_episodes: { label: 'Horlama epizodu', unit: '' },
  snore_window_pct: { label: 'Horlamalı pencere', unit: '%' },
  longest_pause_sec: { label: 'En uzun duraklama', unit: 'sn' },
  calories_in: { label: 'Alınan kalori', unit: 'kcal' },
  // Telefonun kendi hareket tanimasi - saatten degil, cepteki telefondan.
  phone_walking_min: { label: 'Telefon: yürüyüş', unit: 'dk' },
  phone_running_min: { label: 'Telefon: koşu', unit: 'dk' },
  phone_cycling_min: { label: 'Telefon: bisiklet', unit: 'dk' },
  phone_in_vehicle_min: { label: 'Telefon: araçta', unit: 'dk' },
  phone_still_min: { label: 'Telefon: hareketsiz', unit: 'dk' },
}

/**
 * Telefonun hareket tanimasi. Ayri bir izin (ACTIVITY_RECOGNITION) ve ayri bir
 * kazanci var: nabiz penceresi kosu/bisiklet/yuruyus araligiyla ortusuyorsa
 * "ne yapiyordun?" diye sorulmaz. Reddedilirse sessizce kapali kalir - hata yok.
 */
function PhoneActivity() {
  const [status, setStatus] = useState<ActivityStatus | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void activityStatus().then(setStatus)
  }, [])

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    try {
      await fn()
      setStatus(await activityStatus())
    } finally {
      setBusy(false)
    }
  }

  const on = status?.granted === true && status.subscribed
  return (
    <div className="mt-4 border-t border-edge-soft pt-3">
      <p className="text-xs text-ink-faint">
        Telefon kendi bildiği hareketi yazar: yürüyüş, koşu, bisiklet, araçta, hareketsiz.
        Konum okunmaz, ham sensör kaydı tutulmaz — yalnız bu beş sınıfın dakikaları.
        İşe yaradığı yer: nabzın yükseldiği aralıkta telefon koştuğunu biliyorsa
        “ne yapıyordun?” diye sorulmaz, seans dolu gelir.
      </p>
      {on && (
        <p className="mt-2 text-xs text-ink-dim">Açık — {status.events} geçiş olayı birikti.</p>
      )}
      <button
        type="button"
        onClick={() => void act(on ? disableActivity : enableActivity)}
        disabled={busy}
        className={`mt-3 w-full rounded-field py-2.5 text-sm disabled:opacity-50 ${
          on ? 'bg-glass-inset text-ink-faint' : 'bg-glass-strong'
        }`}
      >
        {busy ? '…' : on ? 'Hareket tanımayı kapat' : 'Hareket tanımaya izin ver'}
      </button>
    </div>
  )
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
          <p className="text-xs text-ink-dim">
            Adım, kalori, kilo, antrenman ve nabız izni gerekiyor. Kan oksijeni, HRV,
            uyku, beslenme ve tansiyon ayrı bir onay ekranında sorulur.
          </p>
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
            <button type="button" onClick={() => void act(async () => { await syncActivity(); await syncHealth() })} disabled={busy} className="flex-1 rounded-field bg-glass-strong py-2.5 text-sm disabled:opacity-50">
              {busy ? 'Okunuyor…' : 'Şimdi oku'}
            </button>
            <button type="button" onClick={() => void act(openHealthConnect)} className="rounded-field bg-glass-inset px-4 text-xs text-ink-faint">
              İzinler
            </button>
          </div>
        </div>
      )}

      <PhoneActivity />
    </Card>
  )
}
