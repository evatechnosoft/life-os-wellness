import { useState } from 'react'

export type Muscle = 'göğüs' | 'sırt' | 'bacak' | 'omuz' | 'kol' | 'karın'

/**
 * Bölgeler basit geometriyle çizilir; insan formu tek gövde konturundan
 * (clipPath) ve yuvarlak uçlu uzuv çizgilerinden gelir. Böylece hem organik
 * görünür hem de her bölge tek tıklanabilir alan kalır.
 */
const TORSO =
  'M50 33c10 0 17 4 18 11l2 22c1 8-1 15-3 21l-2 11c-1 5-7 7-15 7s-14-2-15-7l-2-11c-2-6-4-13-3-21l2-22c1-7 8-11 18-11z'

type Shape =
  | { kind: 'clip'; y: number; h: number }
  | { kind: 'path'; d: string; width: number }
  | { kind: 'circle'; cx: number; cy: number; r: number }

interface Region {
  muscle: Muscle
  shapes: Shape[]
}

const SHOULDER: Shape[] = [
  { kind: 'circle', cx: 30, cy: 45, r: 8.5 },
  { kind: 'circle', cx: 70, cy: 45, r: 8.5 },
]
const ARM: Shape[] = [
  { kind: 'path', d: 'M26 51 20 76 22 100', width: 8.5 },
  { kind: 'path', d: 'M74 51 80 76 78 100', width: 8.5 },
]
const LEG: Shape[] = [
  { kind: 'path', d: 'M44 102 41 136 42 166', width: 11 },
  { kind: 'path', d: 'M56 102 59 136 58 166', width: 11 },
]

const FRONT: Region[] = [
  { muscle: 'omuz', shapes: SHOULDER },
  { muscle: 'göğüs', shapes: [{ kind: 'clip', y: 33, h: 31 }] },
  { muscle: 'karın', shapes: [{ kind: 'clip', y: 66, h: 40 }] },
  { muscle: 'kol', shapes: ARM },
  { muscle: 'bacak', shapes: LEG },
]

const BACK: Region[] = [
  { muscle: 'omuz', shapes: SHOULDER },
  { muscle: 'sırt', shapes: [{ kind: 'clip', y: 33, h: 47 }] },
  { muscle: 'kol', shapes: ARM },
  { muscle: 'bacak', shapes: LEG },
]

function Shapes({ shapes, on }: { shapes: Shape[]; on: boolean }) {
  const fill = on ? 'fill-a1/80' : 'fill-glass-strong'
  const stroke = on ? 'stroke-a1/80' : 'stroke-glass-strong'
  return (
    <>
      {shapes.map((s, i) => {
        if (s.kind === 'clip') {
          return <rect key={i} x={20} y={s.y} width={60} height={s.h} clipPath="url(#torso)" className={fill} />
        }
        if (s.kind === 'circle') {
          return <circle key={i} cx={s.cx} cy={s.cy} r={s.r} className={fill} />
        }
        return (
          <path
            key={i}
            d={s.d}
            fill="none"
            strokeWidth={s.width}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={stroke}
          />
        )
      })}
    </>
  )
}

interface BodyPickerProps {
  selected: Muscle[]
  onToggle: (muscle: Muscle) => void
}

/** Kas grubu seçimi çip listesi yerine vücut üzerinden. Sırt ön yüzde görünmediği için ayrı görünüm. */
export function BodyPicker({ selected, onToggle }: BodyPickerProps) {
  const [view, setView] = useState<'front' | 'back'>('front')
  const regions = view === 'front' ? FRONT : BACK

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wide text-ink-faint">
          {selected.length === 0 ? 'Bölge seç' : selected.join(' · ')}
        </span>
        <button
          type="button"
          onClick={() => setView(view === 'front' ? 'back' : 'front')}
          className="rounded-pill bg-glass-inset px-3 py-1.5 text-xs text-ink-dim"
        >
          {view === 'front' ? 'Ön' : 'Arka'}
        </button>
      </div>

      <svg viewBox="0 0 100 180" className="mx-auto mt-1 h-64 w-auto" role="group" aria-label="Çalışılan bölge">
        <defs>
          <clipPath id="torso">
            <path d={TORSO} />
          </clipPath>
        </defs>

        {/* Kafa, boyun, el ve ayaklar seçime girmez. */}
        <g className="fill-glass-inset">
          <ellipse cx={50} cy={18} rx={10} ry={12} />
          <rect x={46} y={28} width={8} height={7} />
          <circle cx={22} cy={103} r={4.5} />
          <circle cx={78} cy={103} r={4.5} />
          <ellipse cx={42} cy={170} rx={7} ry={4} />
          <ellipse cx={58} cy={170} rx={7} ry={4} />
        </g>

        {regions.map((r) => {
          const on = selected.includes(r.muscle)
          return (
            <g
              key={r.muscle}
              role="button"
              tabIndex={0}
              aria-pressed={on}
              aria-label={r.muscle}
              onClick={() => onToggle(r.muscle)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onToggle(r.muscle))}
              className="cursor-pointer outline-none"
            >
              <Shapes shapes={r.shapes} on={on} />
            </g>
          )
        })}

        <path d={TORSO} fill="none" strokeWidth={0.8} className="stroke-edge" />
      </svg>
    </div>
  )
}
