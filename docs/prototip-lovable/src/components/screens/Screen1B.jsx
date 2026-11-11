const BARS = [
  { label: 'Protein', value: 92, goal: 150, unit: 'g', color: '#2dd4bf' },
  { label: 'Kalori', value: 1020, goal: 2120, unit: 'kcal', color: '#6366f1' },
  { label: 'Adım', value: 5760, goal: 8000, unit: '', color: '#ec4899' },
]

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
const STEP_PCT = [62, 74, 81, 54, 90, 76, 58]

const MINI_30 = [60, 72, 55, 80, 66, 70, 58, 75, 68, 82, 60, 77, 65, 70, 50, 65, 72, 68, 60, 55, 62, 78, 82, 70, 85, 90, 75, 80]
const WEEK_AVG = ['Ort. 7100', 'Ort. 7400', 'Ort. 6950', 'Ort. 7600']

export default function Screen1B() {
  return (
    <div className="pt-2 pb-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-bold text-white">Özet</h2>
        <span className="text-[11px] text-white/40">Bugün, 12 Mart</span>
      </div>
      <p className="text-xs text-white/40 mt-1 mb-4">Günlük hedeflerin çubuk görünümü</p>

      <div className="rounded-[18px] bg-white/[0.06] border border-white/[0.07] p-5 backdrop-blur-md flex flex-col gap-4">
        {BARS.map((b) => {
          const pct = Math.min((b.value / b.goal) * 100, 100)
          return (
            <div key={b.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-white/70">{b.label}</span>
                <span className="text-xs text-white">
                  {b.value}
                  <span className="text-white/35"> / {b.goal} {b.unit}</span>
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: b.color }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-[18px] bg-white/[0.06] border border-white/[0.07] p-4 mt-4 backdrop-blur-md">
        <span className="text-xs font-semibold text-white/70 mb-3 block">7 günlük adım grafiği</span>
        <svg viewBox="0 0 320 140" className="w-full h-28">
          {STEP_PCT.map((v, i) => {
            const x = 14 + i * 44
            const h = v
            const y = 110 - h
            const today = i === 6
            return (
              <g key={i}>
                <rect x={x} y={y} width="30" height={h} rx="6" fill={today ? '#2dd4bf' : 'rgba(99,102,241,0.55)'} />
                <text x={x + 15} y="128" textAnchor="middle" className={today ? 'fill-teal-300' : 'fill-white/40'} style={{ font: '600 10px sans-serif' }}>
                  {DAYS[i]}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="rounded-[18px] bg-white/[0.06] border border-white/[0.07] p-4 mt-3 backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-white/70">30 günlük mini özet</span>
          <span className="text-[11px] text-green-400 font-semibold">+6% bu ay</span>
        </div>
        <svg viewBox="0 0 280 60" className="w-full h-14">
          {MINI_30.map((v, i) => {
            const x = i * 10
            const h = v * 0.5
            const y = 50 - h
            return <rect key={i} x={x} y={y} width="6" height={h} rx="2" fill="rgba(45,212,191,0.55)" />
          })}
        </svg>
        <div className="grid grid-cols-4 gap-2 mt-3">
          {WEEK_AVG.map((w, i) => (
            <div key={i} className="text-center">
              <span className="text-[10px] text-white/40 block">Hf {i + 1}</span>
              <span className="text-[11px] font-semibold text-white/80">{w}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}