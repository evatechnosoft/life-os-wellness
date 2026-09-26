import { useLiveQuery } from 'dexie-react-hooks'

import { BODY_METRICS, BODY_WINDOW_DAYS, bodySeries, bodySummary, bodyText, signed, type BodyPoint } from '../lib/body'
import { db } from '../lib/db'
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

  const s = bodySummary(series)
  const recent = series.slice(-CHART_POINTS)
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
        <p className="py-2 text-xs text-ink-faint">
          Henüz OKOK tartı ölçümü yok. Tartıyı Health Connect ile eşleyince yağ, kas ve viseral yağ burada görünür.
        </p>
      ) : (
        <>
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
                <tr key={p.date} className="border-t border-edge-soft">
                  <td className="py-1.5">{shortDate(p.date)}</td>
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
