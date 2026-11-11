import { useState } from 'react'
import SegmentedTabs from '../components/SegmentedTabs.jsx'
import Card from '../components/Card.jsx'
import Ring, { MiniRing } from '../components/Ring.jsx'
import { gunData, haftaData, ayData } from '../data/mockData.js'

const tabs = [
  { value: 'gun', label: 'Gün' },
  { value: 'hafta', label: 'Hafta' },
  { value: 'ay', label: 'Ay' },
]

export default function Page1A() {
  const [tab, setTab] = useState('gun')

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">Özet</h1>
        <p className="text-white/40 text-sm">Halka görünümü</p>
      </div>

      <SegmentedTabs options={tabs} value={tab} onChange={setTab} />

      {tab === 'gun' && <GunView />}
      {tab === 'hafta' && <HaftaView />}
      {tab === 'ay' && <AyView />}
    </div>
  )
}

function GunView() {
  const { protein, kalori, adim, uyku, nabiz } = gunData
  return (
    <div className="flex flex-col gap-4">
      <Card className="flex justify-around items-center py-6">
        <RingStat label="Protein" value={protein.value} goal={protein.goal} unit={protein.unit} color="#2dd4bf" />
        <RingStat label="Kalori" value={kalori.value} goal={kalori.goal} unit={kalori.unit} color="#6366f1" />
        <RingStat label="Adım" value={adim.value} goal={adim.goal} unit={adim.unit} color="#ec4899" />
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="flex flex-col items-center gap-1">
          <span className="text-white/40 text-xs">Uyku</span>
          <span className="text-xl font-bold">{uyku.value}</span>
          <span className="text-white/40 text-xs">{uyku.unit}</span>
        </Card>
        <Card className="flex flex-col items-center gap-1">
          <span className="text-white/40 text-xs">Dinlenme Nabzı</span>
          <span className="text-xl font-bold">{nabiz.value}</span>
          <span className="text-white/40 text-xs">{nabiz.unit}</span>
        </Card>
      </div>
    </div>
  )
}

function RingStat({ label, value, goal, unit, color }) {
  const progress = value / goal
  return (
    <div className="flex flex-col items-center gap-2">
      <Ring progress={progress} size={88} strokeWidth={9} color={color}>
        <div className="flex flex-col items-center">
          <span className="text-sm font-bold">{value}</span>
          <span className="text-[9px] text-white/40">/{goal}</span>
        </div>
      </Ring>
      <span className="text-xs text-white/60">{label}</span>
    </div>
  )
}

function HaftaView() {
  const { kiloTrend, gunler } = haftaData
  const trendColor = kiloTrend <= 0 ? 'text-good' : 'text-bad'
  return (
    <div className="flex flex-col gap-4">
      <Card className="flex items-center justify-between">
        <span className="text-white/60 text-sm">Kilo trendi</span>
        <span className={`font-bold text-lg ${trendColor}`}>
          {kiloTrend > 0 ? '+' : ''}
          {kiloTrend} kg/hf
        </span>
      </Card>

      <Card>
        <div className="flex justify-between">
          {gunler.map((g) => (
            <div key={g.gun} className="flex flex-col items-center gap-2">
              <div className="relative w-9 h-9">
                <MiniRing progress={g.adim} size={36} strokeWidth={4} color="#ec4899" />
                <div className="absolute inset-0 -m-1.5">
                  <MiniRing progress={g.kalori} size={45} strokeWidth={0} color="transparent" />
                </div>
              </div>
              <span className="text-[10px] text-white/40">{g.gun}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 justify-center mt-4 text-[10px] text-white/40">
          <Legend color="#2dd4bf" label="Protein" />
          <Legend color="#6366f1" label="Kalori" />
          <Legend color="#ec4899" label="Adım" />
        </div>
      </Card>

      <Card>
        <div className="flex justify-between items-end h-28">
          {gunler.map((g) => (
            <div key={g.gun} className="flex flex-col items-center gap-2">
              <StackedRing values={[g.protein, g.kalori, g.adim]} />
              <span className="text-[10px] text-white/40">{g.gun}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function StackedRing({ values }) {
  const colors = ['#2dd4bf', '#6366f1', '#ec4899']
  const size = 44
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {values.map((v, i) => (
        <div key={i} className="absolute inset-0" style={{ transform: `scale(${1 - i * 0.22})` }}>
          <MiniRing progress={v} size={size} strokeWidth={4} color={colors[i]} />
        </div>
      ))}
    </div>
  )
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-1">
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      {label}
    </div>
  )
}

function AyView() {
  const { gunlukDoluluk, haftalikOrtalama } = ayData
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <p className="text-white/60 text-sm mb-3">Günlük doluluk</p>
        <div className="grid grid-cols-7 gap-2">
          {gunlukDoluluk.map((v, i) => (
            <MiniRing key={i} progress={v} size={28} strokeWidth={3.5} color="#2dd4bf" />
          ))}
        </div>
      </Card>

      <Card>
        <p className="text-white/60 text-sm mb-3">Haftalık ortalama</p>
        <div className="flex justify-around">
          {haftalikOrtalama.map((h) => (
            <div key={h.hafta} className="flex flex-col items-center gap-2">
              <StackedRing values={[h.protein / 100, h.kalori / 100, h.adim / 100]} />
              <span className="text-[10px] text-white/40">{h.hafta}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
