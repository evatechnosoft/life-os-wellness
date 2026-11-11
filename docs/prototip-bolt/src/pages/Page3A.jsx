import Icon from '../components/Icon.jsx'
import { groups } from '../data/digerData.js'

const tileColors = {
  hedefler: '#2dd4bf',
  hareket: '#6366f1',
  seanstabak: '#ec4899',
  tarif: '#2dd4bf',
  hatirlat: '#6366f1',
  saat: '#2dd4bf',
  disaaktar: '#6366f1',
  ayarlar: '#ec4899',
}

export default function Page3A() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">Diğer</h1>
        <p className="text-white/40 text-sm">Kutu grid görünümü</p>
      </div>

      {groups.map((g) => (
        <section key={g.key} className="flex flex-col gap-2.5">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-wide px-1">
            {g.label}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {g.items.map((item) => (
              <Tile key={item.id} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function Tile({ item }) {
  const color = tileColors[item.id] || '#2dd4bf'
  return (
    <button className="glass-card p-4 flex flex-col items-start gap-3 text-left active:scale-[.97] transition-transform hover:bg-white/[.09]">
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center"
        style={{ background: `${color}22`, color }}
      >
        <Icon name={item.icon} className="w-5 h-5" />
      </div>
      <span className="text-sm font-semibold text-white/85 leading-snug">
        {item.label}
      </span>
    </button>
  )
}
