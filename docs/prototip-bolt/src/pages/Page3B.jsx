import { useState } from 'react'
import Icon from '../components/Icon.jsx'
import { flatMostUsed, flatSections } from '../data/digerData.js'

export default function Page3B() {
  const [open, setOpen] = useState({ ara: true, kurulum: true })

  const toggle = (key) => setOpen((o) => ({ ...o, [key]: !o[key] }))

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">Diğer</h1>
        <p className="text-white/40 text-sm">Liste görünümü</p>
      </div>

      <section className="flex flex-col gap-2.5">
        <p className="text-white/50 text-xs font-semibold uppercase tracking-wide px-1">
          En çok kullanılan
        </p>
        <GroupList items={flatMostUsed} />
      </section>

      {flatSections.map((s) => (
        <section key={s.key} className="flex flex-col gap-2.5">
          <button
            onClick={() => toggle(s.key)}
            className="flex items-center justify-between px-1"
          >
            <span className="text-white/50 text-xs font-semibold uppercase tracking-wide">
              {s.label}
            </span>
            <Icon
              name="chevron"
              className={`w-3.5 h-3.5 text-white/30 transition-transform ${
                open[s.key] ? 'rotate-90' : ''
              }`}
            />
          </button>
          {open[s.key] && <GroupList items={s.items} />}
        </section>
      ))}

      <section className="flex flex-col gap-2.5 mt-2">
        <div className="glass-card overflow-hidden">
          <button className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-white/[.06] transition-colors">
            <div className="w-8 h-8 rounded-xl bg-bad/15 flex items-center justify-center text-bad shrink-0">
              <Icon name="trash" className="w-4.5 h-4.5" />
            </div>
            <span className="text-sm font-semibold text-bad">Veri sil</span>
          </button>
        </div>
      </section>
    </div>
  )
}

function GroupList({ items }) {
  return (
    <div className="glass-card overflow-hidden divide-y divide-white/[.06]">
      {items.map((item) => (
        <button
          key={item.id}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-white/[.06] transition-colors"
        >
          <div className="w-8 h-8 rounded-xl bg-teal/15 flex items-center justify-center text-teal shrink-0">
            <Icon name={item.icon} className="w-4.5 h-4.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white/85 truncate">{item.label}</p>
            {item.sub && <p className="text-xs text-white/35 truncate">{item.sub}</p>}
          </div>
          <Icon name="chevron" className="w-4 h-4 text-white/25 shrink-0" />
        </button>
      ))}
    </div>
  )
}
