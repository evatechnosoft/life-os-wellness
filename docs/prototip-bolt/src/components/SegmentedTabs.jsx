export default function SegmentedTabs({ options, value, onChange }) {
  return (
    <div className="flex glass-card p-1 gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 py-2 rounded-2xl text-sm font-semibold transition-all ${
            value === opt.value
              ? 'bg-teal text-bg shadow-md shadow-teal/20'
              : 'text-white/50 hover:text-white/80'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
