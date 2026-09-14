import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'

import { db } from '../lib/db'
import { estimateKcal } from '../lib/metrics'
import { dismissWorkout, upsertWorkout } from '../lib/store'
import { Card } from './Field'
import { draftToWorkout, emptyDraft, WorkoutFields, type WorkoutDraft } from './WorkoutForm'

/**
 * Saatten gelen ama henuz onaylanmamis seanslar. Uc kaynak ayni karta duser:
 * cihazin tanidigi egzersiz ("Yuzme, 35 dk - onayla?"), tanimadigi seans ("bu
 * neydi?") ve cihazin hic seans yazmadigi ama nabzin uzun sure yuksek kaldigi
 * pencere ("14:20-14:55 arasi 138 bpm'e cikti, ne yapiyordun?").
 *
 * Onaylanana kadar kayit needs_review kalir ve gunun antrenman listesine karismaz.
 */
export function ReviewWorkout({ date, bodyKg }: { date: string; bodyKg: number | null }) {
  const pending =
    useLiveQuery(() => db.workout.where('date').equals(date).filter((w) => w.needs_review === true).toArray(), [date]) ??
    []
  const [drafts, setDrafts] = useState<Record<string, WorkoutDraft>>({})
  if (pending.length === 0) return null

  return (
    <Card title="Saat bir hareket gördü">
      {pending.map((w) => {
        // Cihaz tipi tanidiysa taslak onunla dolu gelir: kullanici tek dokunusla
        // onaylar. Tanimadiysa tip secimi bos kalmaz ama soru acik sorulur.
        const detected = w.notes?.startsWith('saat: ') === true
        const draft = drafts[w.id] ?? { ...emptyDraft, type: w.type, minutes: String(w.duration_min ?? '') }
        const kcal = estimateKcal({ ...w, ...draftToWorkout(draft) }, bodyKg)
        return (
          <div key={w.id} className="mt-2 border-t border-edge-soft pt-3 first:mt-0 first:border-0 first:pt-0">
            <p className="text-sm text-ink-dim">
              {w.notes ?? (w.duration_min ? `${w.duration_min} dakika hareket` : 'Bir seans')}
              {w.duration_min ? ` · ${w.duration_min} dk` : ''}
            </p>
            <p className="mt-1 text-xs text-ink-faint">{detected ? 'Onaylıyor musun?' : 'Ne yapıyordun?'}</p>
            <div className="mt-3">
              <WorkoutFields value={draft} onChange={(d) => setDrafts((all) => ({ ...all, [w.id]: d }))} showMinutes />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => void upsertWorkout({ ...w, ...draftToWorkout(draft), needs_review: false })}
                className="flex-1 rounded-field bg-a1/90 py-3 text-sm font-medium text-solid active:bg-a1"
              >
                {detected ? 'Onayla' : 'Bunu yaptım'}
              </button>
              {/* Silmek yetmez: ayni seans bir sonraki senkronda ayni id ile
                  geri gelirdi - dismissWorkout reddi kalici isaretler. */}
              <button
                type="button"
                onClick={() => void dismissWorkout(w.id)}
                className="min-h-11 rounded-field bg-glass-inset px-4 text-sm text-ink-faint"
              >
                Ben değildim
              </button>
            </div>
            {kcal != null && <p className="mt-2 text-xs text-ink-faint">~{kcal} kcal (tahmin)</p>}
          </div>
        )
      })}
    </Card>
  )
}
