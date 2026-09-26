import { useId } from 'react'

const nf1 = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

const PAD = { left: 4, right: 34, top: 10, bottom: 8 }

/** Tek serilik egri, son deger etiketli. Inline SVG: grafik icin paket eklemeye deger bir is degil. */
export function Sparkline({ points, label, color = '#2dd4bf' }: { points: (number | null)[]; label: string; color?: string }) {
  // Ayni ekranda birden cok egri: gradyan id'si cakismasin.
  const gradient = useId()
  const known = points.filter((p): p is number => p != null)
  if (known.length < 2) return <p className="text-xs text-ink-faint">Yeterli veri yok.</p>

  const min = Math.min(...known)
  const max = Math.max(...known)
  const span = max - min || 1
  const width = 200 - PAD.left - PAD.right
  const height = 60 - PAD.top - PAD.bottom
  const base = 60 - PAD.bottom
  const x = (i: number) => PAD.left + (points.length > 1 ? (i / (points.length - 1)) * width : width / 2)
  const y = (v: number) => PAD.top + (1 - (v - min) / span) * height

  const drawn = points.flatMap((p, i) => (p == null ? [] : [{ i, v: p }]))
  const line = drawn.map((d, n) => `${n === 0 ? 'M' : 'L'}${x(d.i).toFixed(1)},${y(d.v).toFixed(1)}`).join(' ')
  const first = drawn[0]!
  const last = drawn[drawn.length - 1]!
  const area = `${line} L${x(last.i).toFixed(1)},${base} L${x(first.i).toFixed(1)},${base} Z`
  const peak = drawn.reduce((best, d) => (d.v > best.v ? d : best), first)

  return (
    <svg viewBox="0 0 200 60" width="100%" className="mt-2 block" role="img" aria-label={label}>
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((t) => (
        <line key={t} x1={PAD.left} x2={200 - PAD.right} y1={PAD.top + t * height} y2={PAD.top + t * height} stroke="rgba(255,255,255,.07)" strokeWidth="1" />
      ))}
      <path d={area} fill={`url(#${gradient})`} />
      <path d={line} stroke={color} strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(last.i)} cy={y(last.v)} r="6" fill="none" stroke={color} strokeOpacity=".4" />
      <circle cx={x(last.i)} cy={y(last.v)} r="3.5" fill={color} />
      <text x={PAD.left} y={PAD.top - 3} fontSize="7" fill="rgba(244,246,251,.38)">
        {nf1.format(peak.v)}
      </text>
      <text x={x(last.i) + 8} y={y(last.v) + 2.5} fontSize="7" fill={color}>
        {nf1.format(last.v)}
      </text>
    </svg>
  )
}
