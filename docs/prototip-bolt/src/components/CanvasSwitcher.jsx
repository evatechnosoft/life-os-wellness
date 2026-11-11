const groups = [
  { key: '1', label: '1A', pair: '1B' },
  { key: '2', label: '2A', pair: '2B' },
  { key: '3', label: '3A', pair: '3B' },
]

export default function CanvasSwitcher({ mode, onChange }) {
  return (
    <div className="flex items-center gap-2 flex-wrap justify-center py-4 px-4">
      {groups.map((g, i) => (
        <div key={g.key} className="flex items-center gap-2">
          <div className="flex glass-card p-1 gap-1">
            <SwitchBtn active={mode === g.label} onClick={() => onChange(g.label)}>
              {g.label}
            </SwitchBtn>
            <SwitchBtn active={mode === g.pair} onClick={() => onChange(g.pair)}>
              {g.pair}
            </SwitchBtn>
          </div>
          {i < groups.length - 1 && <span className="text-white/20 text-sm">|</span>}
        </div>
      ))}
      <span className="text-white/20 text-sm">|</span>
      <SwitchBtn active={mode === 'all'} onClick={() => onChange('all')} wide>
        Yan yana
      </SwitchBtn>
    </div>
  )
}

function SwitchBtn({ active, onClick, children, wide }) {
  return (
    <button
      onClick={onClick}
      className={`${wide ? 'px-4' : 'px-3'} py-2 rounded-2xl text-sm font-semibold transition-all ${
        active
          ? 'bg-teal text-bg shadow-md shadow-teal/20'
          : 'glass-card text-white/50 hover:text-white/80'
      }`}
    >
      {children}
    </button>
  )
}
