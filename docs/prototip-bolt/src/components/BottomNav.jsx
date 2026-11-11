const icons = {
  bugun: (
    <path d="M4 12l8-8 8 8M6 10v9h12v-9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  ),
  plan: (
    <path d="M5 4h14v16H5zM5 9h14M9 4v5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  ),
  olcum: (
    <path d="M4 17V7a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2zM8 11v3M12 9v5M16 11v3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  ),
  koc: (
    <path d="M12 2a5 5 0 015 5c0 2-1 3-2 4s-1 2-1 3h-4c0-1 0-2-1-3s-2-2-2-4a5 5 0 015-5zM9 19h6M10 22h4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  ),
}

const items = [
  { key: 'bugun', label: 'Bugün' },
  { key: 'plan', label: 'Plan' },
  { key: 'olcum', label: 'Ölçüm' },
  { key: 'koc', label: 'Koç' },
]

export default function BottomNav({ active = 'bugun' }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-20 px-4 pb-4 z-20">
      <div className="h-16 glass-card flex items-center justify-between px-3 relative">
        {items.slice(0, 2).map((it) => (
          <NavItem key={it.key} item={it} active={active === it.key} />
        ))}

        <div className="w-14" />

        {items.slice(2).map((it) => (
          <NavItem key={it.key} item={it} active={active === it.key} />
        ))}

        <button
          className="absolute left-1/2 -translate-x-1/2 -top-6 w-14 h-14 rounded-full bg-teal shadow-lg shadow-teal/30 flex items-center justify-center text-bg text-3xl font-light active:scale-95 transition-transform"
          aria-label="Ekle"
        >
          +
        </button>
      </div>
    </div>
  )
}

function NavItem({ item, active }) {
  return (
    <button
      className={`flex flex-col items-center gap-1 w-14 transition-colors ${
        active ? 'text-teal' : 'text-white/40'
      }`}
      aria-label={item.label}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6">
        {icons[item.key]}
      </svg>
      <span className="text-[10px] font-medium">{item.label}</span>
    </button>
  )
}
