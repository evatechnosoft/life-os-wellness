import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'

import { db, type Meal } from '../lib/db'
import { capturePhoto, deleteMeal, estimateFromPhoto, saveMeal, type Estimate } from '../lib/meals'
import { Card } from './Field'

function PhotoThumb({ photo }: { photo?: Blob }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!photo) return
    const objectUrl = URL.createObjectURL(photo)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [photo])

  if (!url) return <div className="size-12 shrink-0 rounded-field bg-glass-inset" />
  return <img src={url} alt="" className="size-12 shrink-0 rounded-field object-cover" />
}

export function Meals({ date }: { date: string }) {
  const meals = useLiveQuery(() => db.meal.where('date').equals(date).toArray(), [date]) ?? []
  const [photo, setPhoto] = useState<Blob | null>(null)
  const [estimate, setEstimate] = useState<Estimate | null>(null)
  const [protein, setProtein] = useState('')
  const [kcal, setKcal] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setPhoto(null)
    setEstimate(null)
    setProtein('')
    setKcal('')
    setNote('')
    setError(null)
  }

  const take = async () => {
    setError(null)
    setBusy('foto')
    try {
      const blob = await capturePhoto()
      setPhoto(blob)
      setBusy('tahmin')
      const guess = await estimateFromPhoto(blob)
      if (guess) {
        setEstimate(guess)
        setProtein(String(Math.round(guess.protein_g)))
        setKcal(String(Math.round(guess.kcal)))
        setNote(guess.items.join(', '))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(null)
    }
  }

  const commit = async () => {
    setBusy('kayit')
    try {
      await saveMeal({
        protein_g: protein === '' ? null : Number(protein),
        kcal: kcal === '' ? null : Number(kcal),
        note: note || null,
        photo: photo ?? undefined,
        estimated: estimate !== null,
      }, date)
      reset()
    } finally {
      setBusy(null)
    }
  }

  const totals = meals.reduce(
    (acc, m) => ({ protein: acc.protein + (m.protein_g ?? 0), kcal: acc.kcal + (m.kcal ?? 0) }),
    { protein: 0, kcal: 0 },
  )

  return (
    <Card title="Öğünler">
      {meals.length > 0 && (
        <ul className="mb-3 space-y-2">
          {meals.map((m: Meal) => (
            <li key={m.id} className="flex items-center gap-3">
              <PhotoThumb photo={m.photo} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm">{m.note || 'öğün'}</div>
                <div className="text-xs text-ink-faint">
                  {m.time}
                  {m.protein_g ? ` · ${m.protein_g} g protein` : ''}
                  {m.kcal ? ` · ${m.kcal} kcal` : ''}
                  {m.estimated ? ' · tahmin' : ''}
                </div>
              </div>
              <button type="button" onClick={() => void deleteMeal(m)} className="px-2 text-xs text-ink-faint">
                sil
              </button>
            </li>
          ))}
        </ul>
      )}

      {meals.length > 0 && (
        <p className="mb-3 text-xs text-ink-faint">
          Bugün: {Math.round(totals.protein)} g protein · {Math.round(totals.kcal)} kcal
        </p>
      )}

      {photo ? (
        <div>
          <div className="flex items-center gap-3">
            <PhotoThumb photo={photo} />
            <p className="text-xs text-ink-dim">
              {busy === 'tahmin'
                ? 'Tahmin ediliyor…'
                : estimate
                  ? `Tahmin (${estimate.confidence}): ${estimate.items.join(', ') || 'tanınamadı'}`
                  : 'Tahmin yok — sayıları kendin gir.'}
            </p>
          </div>

          {estimate && (
            <p className="mt-2 text-xs text-a3">
              Porsiyon ağırlığı fotoğraftan görünmez; bu bir tahmindir. Doğrulamadan kaydetme.
            </p>
          )}

          <div className="mt-3 flex gap-2">
            <input
              type="number"
              inputMode="numeric"
              placeholder="protein g"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              className="w-28 rounded-field bg-glass-inset px-3 py-2 text-center tabular-nums outline-none focus:ring-2 focus:ring-a1"
            />
            <input
              type="number"
              inputMode="numeric"
              placeholder="kcal"
              value={kcal}
              onChange={(e) => setKcal(e.target.value)}
              className="w-28 rounded-field bg-glass-inset px-3 py-2 text-center tabular-nums outline-none focus:ring-2 focus:ring-a1"
            />
          </div>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="ne yedin?"
            className="mt-2 w-full rounded-field bg-glass-inset px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-a1"
          />

          <div className="mt-3 flex gap-2">
            <button type="button" onClick={reset} className="rounded-field bg-glass-inset px-4 py-2.5 text-sm text-ink-faint">
              Vazgeç
            </button>
            <button
              type="button"
              onClick={() => void commit()}
              disabled={busy !== null}
              className="flex-1 rounded-field bg-a1/90 py-2.5 text-sm font-medium active:bg-a1 disabled:opacity-50"
            >
              Kaydet
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => void take()}
          disabled={busy !== null}
          className="w-full rounded-field bg-glass-strong py-3 text-sm disabled:opacity-50"
        >
          {busy === 'foto' ? 'Kamera açılıyor…' : 'Fotoğrafla öğün ekle'}
        </button>
      )}

      {error && <p className="mt-2 text-xs text-a3">{error}</p>}
    </Card>
  )
}
