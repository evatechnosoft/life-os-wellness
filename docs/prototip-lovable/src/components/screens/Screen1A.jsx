import { useState } from 'react'
import { IconMoon, IconHeart } from '../Icons'

const RINGS = [
  { key: 'adim', label: 'Adım', value: 5760, goal: 8000, color: '#ec4899', r: 70 },
  { key: 'kalori', label: 'Kalori', value: 1020, goal: 2120, color: '#6366f1', r: 54 },
  { key: 'protein', label: 'Protein', value: 92, goal: 150, color: '#2dd4bf', r: 38 },
]

function Ring({ r, progress, color }) {
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - Math.min(progress, 1))
  return (
    <>
      <circle cx="90" cy="90" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
      <circle
        cx="90"
        cy="90"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 90 90)"
      />
    </>
  )
}

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
const DAY_PROGRESS = [0.9, 0.65, 0.78, 0.55, 1.0, 0.82, 0.72]

export default function Screen1A() {
  const [tab, setTab] = useState('Gün')

  return (
    <div className="pt-2 pb-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-bold text-white">Özet</h2>
        <span className="text-[11px] text-white/40">Bugün, 12 Mart</span>
      </div>

      <div className="flex bg-white/5 border border-white/10 rounded-full p-1 mb-5 mt-3">
        {['Gün', 'Hafta', 'Ay'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 text-xs font-semibold py-2 rounded-full transition-colors duration-200 ${
              tab === t ? 'bg-teal-400 text-[#0b0d12]' : 'text-white/50 hover:text-white/80'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="rounded-[18px] bg-white/[0.06] border border-white/[0.07] p-5 backdrop-blur-md">
        <div className="flex items-center justify-center">
          <svg viewBox="0 0 180 180" className="w-44 h-44">
            {RINGS.map((ring) => (
              <Ring key={ring.key} r={ring.r} progress={ring.value / ring.goal} color={ring.color} />
            ))}
            <text x="90" y="85" textAnchor="middle" className="fill-white" style={{ font: '700 22px sans-serif' }}>
              5760
            </text>
            <text x="90" y="104" textAnchor="middle" className="fill-white/40" style={{ font: '500 10px sans-serif' }}>
              adım
            </text>
          </svg>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          {RINGS.map((ring) => (
            <div key={ring.key} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ring.color }} />
                <span className="text-white/60">{ring.label}</span>
              </div>
              <span className="text-white font-semibold">
                {ring.value}
                <span className="text-white/35 font-normal"> / {ring.goal}{ring.key === 'protein' ? ' g' : ''}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[18px] bg-white/[0.06] border border-white/[0.07] p-4 mt-4 backdrop-blur-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-white/70">7 günlük kilo trendi</span>
          <span className="text-xs font-semibold text-green-400">-0.4 kg/hf</span>
        </div>
        <svg viewBox="0 0 120 40" className="w-full h-10">
          <polyline
            points="0,0 20,8.9 40,4.4 60,22.2 80,31.1 100,26.7 120,40"
            fill="none"
            stroke="#2dd4bf"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <div className="rounded-[18px] bg-white/[0.06] border border-white/[0.07] p-4 backdrop-blur-md flex flex-col gap-2">
          <IconMoon className="w-5 h-5 text-indigo-300" />
          <span className="text-xs text-white/50">Uyku</span>
          <span className="text-lg font-bold text-white">6:48</span>
        </div>
        <div className="rounded-[18px] bg-white/[0.06] border border-white/[0.07] p-4 backdrop-blur-md flex flex-col gap-2">
          <IconHeart className="w-5 h-5 text-pink-300" />
          <span className="text-xs text-white/50">Dinlenme nabzı</span>
          <span className="text-lg font-bold text-white">61 bpm</span>
        </div>
      </div>

      <div className="rounded-[18px] bg-white/[0.06] border border-white/[0.07] p-4 mt-3 backdrop-blur-md">
        <span className="text-xs font-semibold text-white/70 mb-3 block">Bu hafta</span>
        <div className="flex justify-between">
          {DAYS.map((day, i) => (
            <div key={day} className="flex flex-col items-center gap-1.5">
              <svg viewBox="0 0 36 36" className="w-8 h-8">
                <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke={i === 6 ? '#2dd4bf' : '#6366f1'}
                  strokeWidth="4"
                  strokeDasharray={2 * Math.PI * 14}
                  strokeDashoffset={2 * Math.PI * 14 * (1 - DAY_PROGRESS[i])}
                  strokeLinecap="round"
                  transform="rotate(-90 18 18)"
                />
              </svg>
              <span className={`text-[10px] ${i === 6 ? 'text-teal-300 font-semibold' : 'text-white/40'}`}>{day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}