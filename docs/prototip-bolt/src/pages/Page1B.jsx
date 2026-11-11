import { useState } from 'react'
import SegmentedTabs from '../components/SegmentedTabs.jsx'
import Card from '../components/Card.jsx'
import Bar, { VerticalBar } from '../components/Bar.jsx'
import { gunData, haftaData, ayData } from '../data/mockData.js'

const tabs = [
  { value: 'gun', label: 'Gün' },
  { value: 'hafta', label: 'Hafta' },
  { value: 'ay', label: 'Ay' },
]

export default function Page1B() {
  const [tab, setTab] = useState('gun')

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">Özet</h1>
        <p className="text-white/40 text-sm">Çubuk görünümü</p>
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
      <Card className="flex flex-col gap-4">
        <BarRow label="Protein" value={protein.value} goal={protein.goal} unit={protein.unit} color="#2dd4bf" />
        <BarRow label="Kalori" value={kalori.value} goal={kalori.goal} unit={kalori.unit} color="#6366f1" />
        <BarRow label="Adım" value={adim.value} goal={adim.goal} unit={adim.unit} color="#ec4899" />
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

function BarRow({ label, value, goal, unit, color }) {
  const progress = value / goal
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-white/60">{label}</span>
        <span className="text-white/40">
          {value}
          <span className="text-white/30">/{goal} {unit}</span>
        </span>
      </div>
      <Bar progress={progress} color={color} height={12} />
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
        <p className="text-white/60 text-sm mb-3">Protein</p>
        <MetricBarChart gunler={gunler} field="protein" color="#2dd4bf" />
      </Card>

      <Card>
        <p className="text-white/60 text-sm mb-3">Kalori</p>
        <MetricBarChart gunler={gunler} field="kalori" color="#6366f1" />
      </Card>

      <Card>
        <p className="text-white/60 text-sm mb-3">Adım</p>
        <MetricBarChart gunler={gunler} field="adim" color="#ec4899" />
      </Card>
    </div>
  )
}

function MetricBarChart({ gunler, field, color }) {
  return (
    <div className="flex justify-between items-end h-24">
      {gunler.map((g) => (
        <div key={g.gun} className="flex flex-col items-center gap-2">
          <VerticalBar progress={g[field]} color={color} width={12} height={72} />
          <span className="text-[10px] text-white/40">{g.gun}</span>
        </div>
      ))}
    </div>
  )
}

function AyView() {
  const { gunlukDoluluk, haftalikOrtalama } = ayData
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <p className="text-white/60 text-sm mb-3">Günlük doluluk</p>
        <div className="flex items-end gap-1 h-20">
          {gunlukDoluluk.map((v, i) => (
            <VerticalBar key={i} progress={v} color="#2dd4bf" width={6} height={80} />
          ))}
        </div>
      </Card>

      <Card>
        <p className="text-white/60 text-sm mb-3">Haftalık ortalama</p>
        <div className="flex flex-col gap-3">
          {haftalikOrtalama.map((h) => (
            <div key={h.hafta} className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs text-white/40">
                <span>{h.hafta}</span>
              </div>
              <div className="flex gap-1">
                <Bar progress={h.protein / 100} color="#2dd4bf" height={8} />
                <Bar progress={h.kalori / 100} color="#6366f1" height={8} />
                <Bar progress={h.adim / 100} color="#ec4899" height={8} />
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-4 justify-center mt-4 text-[10px] text-white/40">
          <Legend color="#2dd4bf" label="Protein" />
          <Legend color="#6366f1" label="Kalori" />
          <Legend color="#ec4899" label="Adım" />
        </div>
      </Card>
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
