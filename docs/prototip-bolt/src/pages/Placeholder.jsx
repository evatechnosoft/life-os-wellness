export default function Placeholder({ title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
      <div className="w-16 h-16 rounded-full glass-card flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-7 h-7 text-white/40">
          <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </div>
      <h2 className="text-lg font-bold text-white/80">{title}</h2>
      <p className="text-white/40 text-sm">{subtitle}</p>
    </div>
  )
}
