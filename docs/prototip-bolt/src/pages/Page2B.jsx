import Card from '../components/Card.jsx'
import { nextSession, quickLogs } from '../data/takipData.js'

export default function Page2B() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">Takip</h1>
        <p className="text-white/40 text-sm">Sıradaki odak</p>
      </div>

      <HeroCard />

      <div>
        <p className="text-white/50 text-xs font-semibold uppercase tracking-wide mb-2 px-1">
          Hızlı kayıt
        </p>
        <div className="flex flex-col gap-2.5">
          {quickLogs.map((q) => (
            <QuickLogRow key={q.id} item={q} />
          ))}
        </div>
      </div>
    </div>
  )
}

function HeroCard() {
  const s = nextSession
  return (
    <div className="rounded-glass p-5 relative overflow-hidden border border-white/10 bg-gradient-to-br from-indigo/25 via-bg to-teal/10">
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-indigo/30 blur-3xl" />
      <div className="relative flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-teal uppercase tracking-wide">
            Sırada · {s.time}
          </span>
          <span className="text-xs text-white/40">{s.duration}</span>
        </div>

        <h2 className="text-xl font-bold">{s.title}</h2>

        <div className="flex flex-col gap-2">
          {s.exercises.map((ex) => (
            <div
              key={ex.id}
              className="flex items-center justify-between glass-card px-3 py-2.5"
            >
              <span className="text-sm text-white/80">{ex.name}</span>
              <span className="text-xs text-white/40">
                {ex.sets}x{ex.reps} · {ex.weight} kg
              </span>
            </div>
          ))}
        </div>

        <button className="mt-1 w-full py-3 rounded-2xl bg-teal text-bg font-bold text-sm active:scale-[.98] transition-transform shadow-lg shadow-teal/20">
          Seansı başlat
        </button>
      </div>
    </div>
  )
}

function QuickLogRow({ item }) {
  return (
    <Card className="flex items-center justify-between py-3.5">
      <div className="flex items-center gap-3">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ background: item.color }}
        />
        <div className="flex flex-col">
          <span className="text-sm font-medium text-white/85">{item.label}</span>
          <span className="text-xs text-white/40">{item.value}</span>
        </div>
      </div>
      <button
        className="w-8 h-8 rounded-full glass-card flex items-center justify-center text-white/60 text-lg font-light active:scale-90 transition-transform"
        aria-label={`${item.label} ekle`}
      >
        +
      </button>
    </Card>
  )
}
