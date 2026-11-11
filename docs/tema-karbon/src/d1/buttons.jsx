// Karbon buton dili – dikdörtgen, 8px radius, gölge yok
// state: 'default' | 'pressed' | 'disabled' (panelde durumları zorlamak için)
const base =
  'inline-flex items-center justify-center gap-2 select-none transition-[background,color,border,transform] duration-100 disabled:cursor-not-allowed';

const variants = {
  primary: {
    d: 'h-12 rounded-lg bg-ko px-5 font-grotesk text-[15px] font-semibold text-kon hover:bg-[#FF6A33] active:bg-kod active:translate-y-[1px]',
    p: 'h-12 rounded-lg bg-kod px-5 font-grotesk text-[15px] font-semibold text-kon translate-y-[1px] shadow-[inset_0_2px_0_rgba(0,0,0,.25)]',
    x: 'h-12 rounded-lg bg-k2 px-5 font-grotesk text-[15px] font-semibold text-km hazard',
  },
  secondary: {
    d: 'h-12 rounded-lg border border-kl bg-transparent px-5 font-grotesk text-[15px] font-medium text-kt hover:border-kt active:bg-k2',
    p: 'h-12 rounded-lg border border-kt bg-k2 px-5 font-grotesk text-[15px] font-medium text-kt',
    x: 'h-12 rounded-lg border border-dashed border-k3 px-5 font-grotesk text-[15px] font-medium text-km/60',
  },
  ghost: {
    d: 'h-10 rounded-lg px-3 font-mono text-[12px] uppercase tracking-[0.14em] text-kt hover:text-ko active:bg-k2',
    p: 'h-10 rounded-lg bg-k2 px-3 font-mono text-[12px] uppercase tracking-[0.14em] text-ko',
    x: 'h-10 rounded-lg px-3 font-mono text-[12px] uppercase tracking-[0.14em] text-km/50 line-through decoration-k3',
  },
  destructive: {
    d: 'h-12 rounded-lg border border-[#E5484D]/60 bg-[#E5484D]/10 px-5 font-grotesk text-[15px] font-semibold text-[#FF6B6E] hover:bg-[#E5484D]/20 active:bg-[#E5484D] active:text-kon',
    p: 'h-12 rounded-lg border border-[#E5484D] bg-[#E5484D] px-5 font-grotesk text-[15px] font-semibold text-kon',
    x: 'h-12 rounded-lg border border-k3 px-5 font-grotesk text-[15px] font-semibold text-km/50',
  },
  icon: {
    d: 'h-11 w-11 rounded-lg border border-k3 bg-k1 text-kt hover:border-kl active:bg-k3',
    p: 'h-11 w-11 rounded-lg border border-kt bg-k3 text-ko',
    x: 'h-11 w-11 rounded-lg border border-k2 bg-k0 text-km/40',
  },
  fab: {
    d: 'h-14 w-[72px] rounded-lg bg-ko text-kon hover:bg-[#FF6A33] active:scale-95 active:bg-kod',
    p: 'h-14 w-[72px] rounded-lg bg-kod text-kon scale-95 shadow-[inset_0_2px_0_rgba(0,0,0,.25)]',
    x: 'h-14 w-[72px] rounded-lg bg-k2 text-km/50 hazard',
  },
};

export function Btn({ v = 'primary', state = 'default', className = '', children, ...rest }) {
  const key = state === 'pressed' ? 'p' : state === 'disabled' ? 'x' : 'd';
  return (
    <button
      className={`${base} ${variants[v][key]} ${className}`}
      disabled={state === 'disabled'}
      aria-pressed={state === 'pressed' ? true : undefined}
      {...rest}
    >
      {children}
    </button>
  );
}

// Chip: açık = turuncu kenar + nokta; kapalı = sadece çizgi
export function Chip({ on, state = 'default', children, onClick }) {
  const dis = state === 'disabled';
  const pr = state === 'pressed';
  const cls = dis
    ? 'border-k2 text-km/40'
    : on
    ? `border-ko text-kt ${pr ? 'bg-ko/20' : 'bg-ko/10'}`
    : `border-k3 text-km hover:text-kt ${pr ? 'bg-k3 text-kt' : ''}`;
  return (
    <button
      onClick={onClick}
      disabled={dis}
      aria-pressed={!!on}
      className={`inline-flex h-8 items-center gap-2 rounded-lg border px-3 font-mono text-[11px] uppercase tracking-[0.1em] ${cls}`}
    >
      <span className={`h-[6px] w-[6px] ${on && !dis ? 'bg-ko' : 'bg-k3'}`} />
      {children}
    </button>
  );
}

// Toggle: köşeli kızak, mono ON/OFF etiketi
export function Toggle({ on, state = 'default', onClick, label = 'Anahtar' }) {
  const dis = state === 'disabled';
  const pr = state === 'pressed';
  return (
    <button
      role="switch"
      aria-checked={!!on}
      aria-label={label}
      disabled={dis}
      onClick={onClick}
      className={`relative h-7 w-[60px] rounded-md border transition-colors ${
        dis ? 'border-k2 bg-k0' : on ? 'border-ko bg-ko/15' : 'border-kl bg-k1'
      }`}
    >
      <span
        className={`absolute top-[3px] h-[20px] rounded-[4px] transition-all ${pr ? 'w-[26px]' : 'w-[20px]'} ${
          dis ? 'left-[3px] bg-k3' : on ? `${pr ? 'left-[29px]' : 'left-[35px]'} bg-ko` : 'left-[3px] bg-km'
        }`}
      />
      <span
        className={`absolute top-1/2 -translate-y-1/2 font-mono text-[9px] tracking-[0.1em] ${
          on ? 'left-[7px] text-ko' : 'right-[6px] text-km'
        } ${dis ? 'opacity-40' : ''}`}
      >
        {on ? 'AÇ' : 'KPL'}
      </span>
    </button>
  );
}
