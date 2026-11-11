import { IconToday, IconPlan, IconRuler, IconCoach, IconPlus } from './Icons'

function NavItem({ icon, label, active }) {
  return (
    <div className="flex flex-col items-center gap-0.5 cursor-pointer select-none">
      <div className={active ? 'text-teal-300' : 'text-white/45'}>{icon}</div>
      <span className={`text-[9px] font-medium ${active ? 'text-teal-300' : 'text-white/45'}`}>{label}</span>
    </div>
  )
}

export default function PhoneFrame({ label, children }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-xs tracking-widest text-white/40 mb-3 font-semibold uppercase">{label}</span>
      <div className="relative w-[390px] max-w-[390px] h-[800px] rounded-[48px] border-[6px] border-white/10 bg-[#0b0d12] overflow-hidden shadow-2xl shadow-black/70">
        <div className="pointer-events-none absolute -top-24 left-1/3 w-[260px] h-[260px] bg-teal-500/10 blur-[90px] rounded-full" />
        <div className="pointer-events-none absolute -top-10 right-0 w-[220px] h-[220px] bg-indigo-500/10 blur-[90px] rounded-full" />

        <div className="relative flex items-center justify-between px-8 pt-4 pb-2 text-[11px] text-white/70 z-10">
          <span className="font-semibold">9:41</span>
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5 items-end">
              <div className="w-0.5 h-1.5 bg-white/60 rounded-sm" />
              <div className="w-0.5 h-2 bg-white/60 rounded-sm" />
              <div className="w-0.5 h-2.5 bg-white/60 rounded-sm" />
              <div className="w-0.5 h-3 bg-white/80 rounded-sm" />
            </div>
            <div className="w-4 h-2.5 rounded-[3px] border border-white/50" />
          </div>
        </div>

        <div className="relative h-[calc(100%-56px)] overflow-y-auto px-4 pb-32 z-10 [&::-webkit-scrollbar]:w-0">
          {children}
        </div>

        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-5 px-5 py-2.5 rounded-full bg-white/10 border border-white/10 backdrop-blur-xl shadow-lg z-20">
          <NavItem icon={<IconToday className="w-5 h-5" />} label="Bugün" active />
          <NavItem icon={<IconPlan className="w-5 h-5" />} label="Plan" />
          <NavItem icon={<IconRuler className="w-5 h-5" />} label="Ölçüm" />
          <NavItem icon={<IconCoach className="w-5 h-5" />} label="Koç" />
        </div>

        <button className="absolute bottom-16 right-5 w-14 h-14 rounded-full bg-teal-400 text-[#0b0d12] shadow-lg shadow-teal-400/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-20">
          <IconPlus className="w-6 h-6" />
        </button>
      </div>
    </div>
  )
}