import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'

import { lastDates } from '../lib/date'
import { db, type Meal } from '../lib/db'
import { capturePhoto, deleteMeal, estimateFromPhoto, saveMeal, type Estimate } from '../lib/meals'
import { movingAverage } from '../lib/metrics'
import { slotGaps, suggestMenus, type MenuSet } from '../lib/nutrition'
import { useGoals } from '../lib/settings'
import { saveDaily } from '../lib/store'
import { Card } from './Field'

const SET_LABEL: Record<MenuSet['set'], string> = {
  usual: 'Alışık olduğun',
  change: 'Değişiklik',
  quick: 'Hızlı',
}

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
  const [hunger, setHunger] = useState<number | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [openSet, setOpenSet] = useState<MenuSet['set'] | null>(null)

  const goals = useGoals()
  const log = useLiveQuery(() => db.daily_log.get(date), [date])
  // Oneri gecmiste gercekten yenmis yiyecekten turer; son hafta cesitlilik cezasi icin.
  const history = useLiveQuery(() => db.meal.reverse().limit(200).toArray(), []) ?? []
  const week = lastDates(7)
  const weekLogs =
    useLiveQuery(() => db.daily_log.where('date').between(week[0]!, week[6]!, true, true).toArray(), [date]) ?? []
  const avgWeight = movingAverage(weekLogs.map((l) => l.weight_kg))
  const now = new Date()
  const clock = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  // Su anki (ya da bir sonraki) acik slot: ekranda tek slot icin oneri durur.
  const gap = slotGaps(meals, avgWeight, goals, clock).find((g) => !g.upcoming) ?? slotGaps(meals, avgWeight, goals, clock)[0]
  const menus = gap ? suggestMenus(history, gap, { recentMeals: history.filter((m) => m.date >= week[4]!) }) : []
  const shownSet = menus.find((m) => m.set === openSet) ?? menus.find((m) => m.selected) ?? menus[0]

  const reset = () => {
    setPhoto(null)
    setEstimate(null)
    setProtein('')
    setKcal('')
    setNote('')
    setHunger(null)
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

  /** Onerilen seti tek dokunusla kaydeder - kalemler tek ogun olarak yazilir. */
  const saveSet = async (set: MenuSet) => {
    setBusy('kayit')
    try {
      await saveMeal({
        protein_g: set.protein_g,
        kcal: null,
        note: set.items.map((i) => i.food).join(', '),
        estimated: false,
        source: 'manual',
      }, date)
      setOpenSet(null)
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
        hunger,
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
                  {m.hunger != null ? ` · açlık ${m.hunger}` : ''}
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

      {shownSet && gap && (
        <div className="mb-3 rounded-field bg-glass-inset p-3">
          <p className="text-xs text-ink-faint">
            {SET_LABEL[shownSet.set]}
            {shownSet.challenge ? ' · bu hafta ilk kez' : ''} — {gap.gap_g} g açık
          </p>
          <p className="mt-1 text-sm text-ink-dim">
            {shownSet.items.map((i) => `${i.grams != null ? `${i.grams} g ` : i.count != null ? `${i.count} ` : ''}${i.food}`).join(' + ')}
            {' · '}
            {shownSet.protein_g} g protein
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => void saveSet(shownSet)}
              disabled={busy !== null}
              className="flex-1 rounded-field bg-a1/90 py-2.5 text-sm font-medium active:bg-a1 disabled:opacity-50"
            >
              Bunu yedim
            </button>
            {menus.filter((m) => m.set !== shownSet.set).map((m) => (
              <button
                key={m.set}
                type="button"
                onClick={() => setOpenSet(m.set)}
                className="rounded-field bg-glass-strong px-3 text-xs text-ink-dim"
              >
                {SET_LABEL[m.set]}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => void saveDaily(date, { overate: !log?.overate })}
        className={`mb-3 w-full rounded-field py-2.5 text-sm ${log?.overate ? 'bg-a2/20 text-ink-dim' : 'bg-glass-inset text-ink-faint'}`}
      >
        {log?.overate ? 'Bugün abarttım · işaretli' : 'Bugün abarttım'}
      </button>

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

          <label className="mt-3 block">
            <span className="text-xs text-ink-faint">
              {hunger == null ? 'Açlık (isteğe bağlı)' : `Açlık: ${hunger}/10`}
            </span>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={hunger ?? 5}
              onChange={(e) => setHunger(Number(e.target.value))}
              className="mt-1 w-full accent-a1"
            />
          </label>

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
