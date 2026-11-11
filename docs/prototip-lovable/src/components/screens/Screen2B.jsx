import { IconDumbbell, IconUtensils, IconRuler, IconPlus } from '../Icons'

const EXERCISES = [
  { name: 'Lat pulldown', sets: '3x10', weight: '45 kg' },
  { name: 'Seated row', sets: '3x10', weight: '40 kg' },
  { name: 'Biceps curl', sets: '2x12', weight: '10 kg' },
]

const QUICK_LOG = [
  { label: 'Öğün', icon: IconUtensils, value: 'Son: Kahvaltı · 31 g', color: 'text-teal-300' },
  { label: 'Kilo', icon: IconRuler, value: 'Son: 81.2 kg', color: 'text-indigo-300' },
  { label: 'Su', icon: IconPlus, value: '1.2 / 2.5 L', color: 'text-pink-300' },
]

export default function Screen2B() {
  return (
    <div className="pt-2 pb-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-bold text-white">Takip</h2>
        <span className="text-[11px] text-white/40">Bugün</span>
      </div>
      <p className="text-xs text-white/40 mt-1 mb-5">Sıradaki antrenman ve hızlı kayıt</p>

      <div className="rounded-[18px] p-5 bg-gradient-to-br from-teal-500/90 to-indigo-600/90 border border-white/10 shadow-xl shadow-indigo-500/20">
        <span className="text-[11px] font-semibold text-white/80 uppercase tracking-wide">Sırada</span>
        <h3 className="text-lg font-bold text-white mt-1">18:30 · Sırt + Biceps</h3>

        <div className="flex flex-col gap-2 mt-4">
          {EXERCISES.map((ex) => (
            <div key={ex.name} className="flex items-center justify-between bg-white/15 rounded-xl px-3 py-2">
              <div className="flex items-center gap-2">
                <IconDumbbell className="w-4 h-4 text-white/90" />
                <span className="text-sm text-white font-medium">{ex.name}</span>
              </div>
              <span className="text-xs text-white/80 font-semibold">{ex.sets} · {ex.weight}</span>
            </div>
          ))}
        </div>

        <button className="w-full mt-4 bg-white text-teal-600 font-bold text-sm py-3 rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all shadow-md">
          Seansı başlat
        </button>
      </div>

      <div className="flex flex-col gap-3 mt-5">
        <span className="text-xs font-semibold text-white/50 uppercase tracking-wide">Hızlı kayıt</span>
        {QUICK_LOG.map((q) => {
          const Icon = q.icon
          return (
            <div
              key={q.label}
              className="flex items-center justify-between rounded-[18px] bg-white/[0.06] border border-white/[0.07] p-3.5 backdrop-blur-md"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                  <Icon className={`w-4.5 h-4.5 ${q.color}`} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white">{q.label}</span>
                  <span className="text-[11px] text-white/40">{q.value}</span>
                </div>
              </div>
              <button className="w-8 h-8 rounded-full bg-teal-400 text-[#0b0d12] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform">
                <IconPlus className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}