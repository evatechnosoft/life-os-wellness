import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'

import {
  BODY_METRICS,
  BODY_WINDOW_DAYS,
  bodySeries,
  bodySummary,
  bodyText,
  parseScale,
  SCALE_FIELDS,
  signed,
  type BodyPoint,
} from '../lib/body'
import { toLocalDate } from '../lib/date'
import { db } from '../lib/db'
import { deleteWearable, recordMetrics, saveDaily } from '../lib/store'
import { Card } from './Field'
import { Sparkline } from './Sparkline'

const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
/** "26 Eyl" from YYYY-MM-DD, no Date parsing (UTC shift). */
const shortDate = (date: string): string => {
  const [, month, day] = date.split('-').map(Number)
  return `${day} ${MONTHS[month! - 1]}`
}

const nf1 = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const fmt = (n: number | null): string => (n == null ? '—' : nf1.format(n))

/** Egri icin son okumalar; tum gecmis kucuk ekranda cizgiyi ezer. */
const CHART_POINTS = 30
const HISTORY_ROWS = 10

/**
 * Renk yone gore: yag ve viseral inerse iyi, yagsiz kutle ve kas korunursa iyi.
 * `noise` alti degisim notr - BIA tek olcumde bu kadar sallanir.
 */
function tone(delta: number | null, downIsGood: boolean, noise: number): string {
  if (delta == null || Math.abs(delta) < noise) return 'text-ink-faint'
  if (downIsGood) return delta < 0 ? 'text-a1' : 'text-a3'
  return delta > 0 ? 'text-a1' : 'text-a3'
}

interface TileProps {
  label: string
  value: number | null
  unit?: string
  sub?: string
  delta: number | null
  deltaUnit?: string
  downIsGood: boolean
  noise: number
}

function Tile({ label, value, unit, sub, delta, deltaUnit = ' kg', downIsGood, noise }: TileProps) {
  return (
    <div className="rounded-field bg-glass-inset px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wide text-ink-faint">{label}</div>
      <div className="mt-0.5 flex items-baseline gap-1">
        <span className="text-lg font-bold tabular-nums">{fmt(value)}</span>
        {unit && value != null && <span className="text-[11px] text-ink-faint">{unit}</span>}
        {sub && <span className="ml-auto text-[11px] tabular-nums text-ink-faint">{sub}</span>}
      </div>
      <div className={`text-[11px] tabular-nums ${tone(delta, downIsGood, noise)}`}>
        {delta == null ? '—' : `${signed(delta)}${deltaUnit}`}
      </div>
    </div>
  )
}

/**
 * OKOK tartisini elle girme / duzeltme (PLAN-DUZELTME D3). Ayni gune tekrar kaydetmek
 * degerleri ezer; Sil o gunun OKOK satirlarini sunucudan da kaldirir. Kilo daily_log'a
 * da yazilir: 7 gun ortalamasi oradan okunuyor.
 */
function ScaleEntry({ initialDate, onDone }: { initialDate: string; onDone: () => void }) {
  const today = toLocalDate()
  const [date, setDate] = useState(initialDate)
  const [values, setValues] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const existing =
    useLiveQuery(() => db.wearable.where('date').equals(date).filter((r) => r.source === 'okok').toArray(), [date]) ?? []
  // Gun degisince o gunun kayitli degerleri forma dolar; kullanici yazdiysa onunki kalir.
  const shown = (metric: string): string =>
    values[metric] ?? (existing.find((r) => r.metric === metric)?.value.toString() ?? '')

  const save = async () => {
    const input = Object.fromEntries(SCALE_FIELDS.map((f) => [f.metric, shown(f.metric)]))
    const { metrics, errors: bad } = parseScale(input)
    setErrors(bad)
    if (bad.length > 0 || Object.keys(metrics).length === 0) return
    setBusy(true)
    try {
      await recordMetrics('okok', date, metrics)
      if (metrics.weight_kg != null) await saveDaily(date, { weight_kg: metrics.weight_kg })
      onDone()
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await deleteWearable(date, 'okok')
      onDone()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-3 rounded-field bg-glass-inset p-3">
      <label className="flex items-center justify-between text-xs text-ink-faint">
        Tarih
        <input
          type="date"
          value={date}
          max={today}
          onChange={(e) => { setDate(e.target.value || today); setValues({}) }}
          className="rounded-field bg-glass px-2 py-1.5 text-sm text-ink outline-none focus:ring-2 focus:ring-a1"
        />
      </label>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {SCALE_FIELDS.map((f) => (
          <label key={f.metric}>
            <span className="block text-[10px] text-ink-faint">{f.label}{f.unit ? ` ${f.unit}` : ''}</span>
            <input
              type="text"
              inputMode="decimal"
              value={shown(f.metric)}
              onChange={(e) => setValues((v) => ({ ...v, [f.metric]: e.target.value }))}
              className="mt-0.5 min-h-10 w-full rounded-field bg-glass px-2 text-center text-sm tabular-nums outline-none focus:ring-2 focus:ring-a1"
            />
          </label>
        ))}
      </div>
      {errors.length > 0 && <p className="mt-2 text-xs text-load">Aralık dışı: {errors.join(' · ')}</p>}
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={onDone} className="rounded-field bg-glass px-3 py-2.5 text-sm text-ink-faint">Vazgeç</button>
        {existing.length > 0 && (
          <button type="button" onClick={() => void remove()} disabled={busy}
            className="rounded-field bg-glass px-3 py-2.5 text-sm text-load disabled:opacity-50">Sil</button>
        )}
        <button type="button" onClick={() => void save()} disabled={busy}
          className="flex-1 rounded-field bg-a1/90 py-2.5 text-sm font-medium text-solid disabled:opacity-50">
          {busy ? 'Kaydediliyor…' : existing.length > 0 ? 'Güncelle' : 'Kaydet'}
        </button>
      </div>
    </div>
  )
}

/**
 * Vucut kompozisyonu gecmisi (OKOK BIA tartisi). Karar birimi 28 gun: kartlar tek
 * olcumu degil pencere icindeki degisimi gosterir.
 */
export function BodyReport() {
  const series =
    useLiveQuery(async () => {
      const rows = await db.wearable.where('metric').anyOf(BODY_METRICS).toArray()
      const dates = [...new Set(rows.map((r) => r.date))]
      const logs = await db.daily_log.where('date').anyOf(dates).toArray()
      return bodySeries(rows, Object.fromEntries(logs.map((l) => [l.date, l.weight_kg])))
    }, []) ?? []

  // Acik tarti formunun gunu; null = form kapali.
  const [entry, setEntry] = useState<string | null>(null)
  const s = bodySummary(series)
  const recent = series.slice(-CHART_POINTS)
  const entryBlock = entry ? (
    <ScaleEntry key={entry} initialDate={entry} onDone={() => setEntry(null)} />
  ) : (
    <button type="button" onClick={() => setEntry(toLocalDate())}
      className="mt-2 w-full rounded-field bg-glass-strong py-2.5 text-sm">
      Tartı gir
    </button>
  )
  const line = (k: keyof BodyPoint) => recent.map((p) => p[k] as number | null)

  return (
    <Card
      id="week-body"
      title="Vücut kompozisyonu"
      collapsible
      defaultOpen
      summary={s?.latest.fat_kg == null ? 'tartı yok' : `yağ ${fmt(s.latest.fat_kg)} kg`}
    >
      {!s ? (
        <>
          <p className="py-2 text-xs text-ink-faint">
            Henüz OKOK tartı ölçümü yok. Tartı ekranındaki değerleri buradan gir.
          </p>
          {entryBlock}
        </>
      ) : (
        <>
          {entryBlock}
          <p className="text-sm text-ink">{bodyText(s)}</p>
          <p className="mt-0.5 text-[11px] tabular-nums text-ink-faint">
            Son tartı {shortDate(s.latest.date)}
            {s.latest.weight != null && ` · ${fmt(s.latest.weight)} kg`}
            {s.change && ` · ${shortDate(s.base.date)} ile kıyas`}
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Tile
              label="Yağ"
              value={s.latest.fat_kg}
              unit="kg"
              sub={s.latest.fat_pct == null ? undefined : `%${fmt(s.latest.fat_pct)}`}
              delta={s.change?.fat_kg ?? null}
              downIsGood
              noise={0.3}
            />
            <Tile label="Yağsız kütle" value={s.latest.lean_kg} unit="kg" delta={s.change?.lean_kg ?? null} downIsGood={false} noise={0.5} />
            <Tile label="İskelet kası" value={s.latest.skeletal_kg} unit="kg" delta={s.change?.skeletal_kg ?? null} downIsGood={false} noise={0.5} />
            <Tile label="Viseral yağ" value={s.latest.visceral} delta={s.change?.visceral ?? null} deltaUnit="" downIsGood noise={0.5} />
          </div>

          <h3 className="mt-4 text-[10px] uppercase tracking-wide text-ink-faint">Yağ · kg</h3>
          <Sparkline points={line('fat_kg')} label="Yağ kütlesi eğrisi" color="#6366f1" />
          <h3 className="mt-3 text-[10px] uppercase tracking-wide text-ink-faint">Yağsız kütle · kg</h3>
          <Sparkline points={line('lean_kg')} label="Yağsız kütle eğrisi" />

          <table className="mt-4 w-full text-[11px] tabular-nums">
            <thead className="text-[10px] uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="py-1 text-left font-normal">Tarih</th>
                <th className="py-1 text-right font-normal">Kilo</th>
                <th className="py-1 text-right font-normal">Yağ</th>
                <th className="py-1 text-right font-normal">Yağsız</th>
                <th className="py-1 text-right font-normal">Kas</th>
              </tr>
            </thead>
            <tbody className="text-ink-dim">
              {[...series].reverse().slice(0, HISTORY_ROWS).map((p) => (
                <tr key={p.date} onClick={() => setEntry(p.date)} className="cursor-pointer border-t border-edge-soft active:bg-glass">
                  <td className="py-1.5">{shortDate(p.date)} <span className="text-ink-faint">✎</span></td>
                  <td className="py-1.5 text-right">{fmt(p.weight)}</td>
                  <td className="py-1.5 text-right">{fmt(p.fat_kg)}</td>
                  <td className="py-1.5 text-right">{fmt(p.lean_kg)}</td>
                  <td className="py-1.5 text-right">{fmt(p.skeletal_kg)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-ink-faint">
            BIA tek ölçümde 1 kg’a kadar sallanır; karar {BODY_WINDOW_DAYS} günlük değişimle verilir.
          </p>
        </>
      )}
    </Card>
  )
}
