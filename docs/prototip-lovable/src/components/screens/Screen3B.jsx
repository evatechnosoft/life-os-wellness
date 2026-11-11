import { useState } from 'react'
import {
  IconTarget,
  IconBook,
  IconUtensils,
  IconShake,
  IconBell,
  IconWatch,
  IconExport,
  IconSettings,
  IconChevronDown,
  IconChevronRight,
  IconTrash,
} from '../Icons'

const SECTIONS = [
  {
    key: 'genel',
    title: 'Genel',
    rows: [
      { icon: IconTarget, label: 'Hedefler', color: 'text-indigo-300' },
      { icon: IconBook, label: 'Hareket kütüphanesi', color: 'text-teal-300' },
      { icon: IconUtensils, label: 'Seans ve Tabak', color: 'text-pink-300' },
    ],
  },
  {
    key: 'tercihler',
    title: 'Tercihler',
    rows: [
      { icon: IconShake, label: 'Shake ve Dondurma', color: 'text-pink-300' },
      { icon: IconBell, label: 'Hatırlatmalar', color: 'text-indigo-300' },
    ],
  },
  {
    key: 'veri',
    title: 'Veri',
    rows: [
      { icon: IconWatch, label: 'Saat / Health Connect', color: 'text-teal-300' },
      { icon: IconExport, label: 'Veri dışa aktar', color: 'text-indigo-300' },
      { icon: IconSettings, label: 'Ayarlar', color: 'text-white/70' },
    ],
  },
]

export default function Screen3B() {
  const [open, setOpen] = useState({ genel: true, tercihler: true, veri: true })

  const toggle = (key) => setOpen((prev) => ({ ...prev, [key]: !prev[key] }))

  return (
    <div className="pt-2 pb-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-bold text-white">Diğer</h2>
      </div>
      <p className="text-xs text-white/40 mt-1 mb-5">Tüm ayarlar ve araçlar</p>

      {SECTIONS.map((section) => (
        <div key={section.key} className="mb-4">
          <button
            onClick={() => toggle(section.key)}
            className="flex items-center justify-between w-full px-1 mb-2"
          >
            <span className="text-xs font-semibold text-white/40 uppercase tracking-wide">
              {section.title}
            </span>
            <IconChevronDown
              className={`w-4 h-4 text-white/30 transition-transform duration-200 ${
                open[section.key] ? 'rotate-0' : '-rotate-90'
              }`}
            />
          </button>

          {open[section.key] && (
            <div className="rounded-[18px] bg-white/[0.06] border border-white/[0.07] backdrop-blur-md overflow-hidden">
              {section.rows.map((row, i) => {
                const Icon = row.icon
                return (
                  <div
                    key={row.label}
                    className={`flex items-center justify-between px-4 py-3.5 ${
                      i !== section.rows.length - 1 ? 'border-b border-white/5' : ''
                    } hover:bg-white/5 transition-colors cursor-pointer`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${row.color}`} />
                      <span className="text-sm text-white">{row.label}</span>
                    </div>
                    <IconChevronRight className="w-4 h-4 text-white/25" />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ))}

      <div className="rounded-[18px] bg-red-400/10 border border-red-400/20 backdrop-blur-md overflow-hidden mt-6">
        <div className="flex items-center justify-between px-4 py-3.5 hover:bg-red-400/10 transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <IconTrash className="w-5 h-5 text-red-400" />
            <span className="text-sm font-semibold text-red-400">Veri sil</span>
          </div>
          <IconChevronRight className="w-4 h-4 text-red-400/50" />
        </div>
      </div>
    </div>
  )
}