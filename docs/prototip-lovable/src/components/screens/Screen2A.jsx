import { IconCheck } from '../Icons'

const ITEMS = [
  { time: '07:10', title: 'Sabah tartısı', status: 'done' },
  { time: '08:00', title: 'Kahvaltı · 31 g protein', status: 'done' },
  { time: '10:30', title: 'Yürüyüş · Health Connect', status: 'done' },
  { time: 'Şimdi', title: 'Öğle · 43 g protein açık', status: 'now' },
  { time: '18:30', title: 'Sırt + Biceps', status: 'upcoming' },
  { time: '20:00', title: 'Akşam yemeği', status: 'upcoming' },
  { time: '22:30', title: 'Akşam retrosu', status: 'upcoming' },
]

export default function Screen2A() {
  return (
    <div className="pt-2 pb-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-bold text-white">Takip</h2>
        <span className="text-[11px] text-white/40">Bugün</span>
      </div>
      <p className="text-xs text-white/40 mt-1 mb-5">Günlük zaman çizelgesi</p>

      <div className="relative pl-7">
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-white/10" />
        <div className="flex flex-col gap-5">
          {ITEMS.map((item, i) => {
            const isDone = item.status === 'done'
            const isNow = item.status === 'now'
            return (
              <div key={i} className="relative flex items-start gap-3">
                <div
                  className={`absolute -left-7 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center border ${
                    isDone
                      ? 'bg-green-400/20 border-green-400 text-green-400'
                      : isNow
                      ? 'bg-teal-400 border-teal-400 text-[#0b0d12] animate-pulse'
                      : 'bg-white/5 border-white/20 text-white/30'
                  }`}
                >
                  {isDone && <IconCheck className="w-3 h-3" />}
                  {isNow && <span className="w-1.5 h-1.5 rounded-full bg-[#0b0d12]" />}
                </div>
                <div
                  className={`flex-1 rounded-[18px] p-3.5 border backdrop-blur-md ${
                    isNow
                      ? 'bg-teal-400/10 border-teal-400/40 shadow-lg shadow-teal-400/10'
                      : 'bg-white/[0.06] border-white/[0.07]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold ${isNow ? 'text-teal-300' : 'text-white'}`}>
                      {item.title}
                    </span>
                    <span className={`text-xs ${isNow ? 'text-teal-300/80 font-semibold' : 'text-white/40'}`}>
                      {item.time}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}