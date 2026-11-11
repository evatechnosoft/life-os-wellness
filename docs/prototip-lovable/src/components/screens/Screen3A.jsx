import {
  IconTarget,
  IconBook,
  IconUtensils,
  IconShake,
  IconBell,
  IconWatch,
  IconExport,
  IconSettings,
} from '../Icons'

const GROUPS = [
  {
    label: 'Her hafta',
    items: [
      { icon: IconTarget, title: 'Hedefler', color: 'text-indigo-300', bg: 'bg-indigo-400/15' },
      { icon: IconBook, title: 'Hareket kütüphanesi', color: 'text-teal-300', bg: 'bg-teal-400/15' },
      { icon: IconUtensils, title: 'Seans ve Tabak', color: 'text-pink-300', bg: 'bg-pink-400/15' },
    ],
  },
  {
    label: 'Ara sıra',
    items: [
      { icon: IconShake, title: 'Shake ve Dondurma', color: 'text-pink-300', bg: 'bg-pink-400/15' },
      { icon: IconBell, title: 'Hatırlatmalar', color: 'text-indigo-300', bg: 'bg-indigo-400/15' },
    ],
  },
  {
    label: 'Kurulum',
    items: [
      { icon: IconWatch, title: 'Saat / Health Connect', color: 'text-teal-300', bg: 'bg-teal-400/15' },
      { icon: IconExport, title: 'Veri dışa aktar', color: 'text-indigo-300', bg: 'bg-indigo-400/15' },
      { icon: IconSettings, title: 'Ayarlar', color: 'text-white/70', bg: 'bg-white/10' },
    ],
  },
]

export default function Screen3A() {
  return (
    <div className="pt-2 pb-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-bold text-white">Diğer</h2>
      </div>
      <p className="text-xs text-white/40 mt-1 mb-5">Araçlar ve ayarlar</p>

      {GROUPS.map((group) => (
        <div key={group.label} className="mb-5">
          <span className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2 block">
            {group.label}
          </span>
          <div className="grid grid-cols-2 gap-3">
            {group.items.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className="rounded-[18px] bg-white/[0.06] border border-white/[0.07] p-4 backdrop-blur-md flex flex-col gap-3 cursor-pointer hover:bg-white/[0.1] transition-colors duration-200"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.bg}`}>
                    <Icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <span className="text-sm font-medium text-white leading-tight">{item.title}</span>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}