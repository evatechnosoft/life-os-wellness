// Toprak buton dili – hap formu, sıcak dolgu, yumuşak basılma
// state: 'default' | 'pressed' | 'disabled'
const base =
  'inline-flex items-center justify-center gap-2 select-none font-manrope transition-[background,color,box-shadow,transform] duration-200 disabled:cursor-not-allowed';

const v = {
  primary: {
    d: 'h-[52px] rounded-full bg-tga px-7 text-[16px] font-bold text-tg0 shadow-[0_6px_20px_rgba(217,160,102,.25)] hover:bg-[#E3AE78] active:scale-[.97] active:bg-tgad',
    p: 'h-[52px] rounded-full bg-tgad px-7 text-[16px] font-bold text-tg0 scale-[.97] shadow-[inset_0_2px_6px_rgba(0,0,0,.25)]',
    x: 'h-[52px] rounded-full bg-tg2 px-7 text-[16px] font-bold text-tgm/60',
  },
  secondary: {
    d: 'h-[52px] rounded-full px-7 text-[16px] font-semibold text-tgs shadow-[inset_0_0_0_1.5px_#7FA88A] hover:bg-tgs/10 active:bg-tgs/20',
    p: 'h-[52px] rounded-full bg-tgs/20 px-7 text-[16px] font-semibold text-[#A5C7AE] shadow-[inset_0_0_0_1.5px_#A5C7AE] scale-[.97]',
    x: 'h-[52px] rounded-full px-7 text-[16px] font-semibold text-tgm/50 shadow-[inset_0_0_0_1.5px_#3A322C]',
  },
  ghost: {
    d: 'h-11 rounded-full px-4 text-[15px] font-semibold text-tga underline decoration-tga/40 underline-offset-4 hover:decoration-tga active:bg-tga/10',
    p: 'h-11 rounded-full bg-tga/15 px-4 text-[15px] font-semibold text-tga underline decoration-tga underline-offset-4',
    x: 'h-11 rounded-full px-4 text-[15px] font-semibold text-tgm/50',
  },
  destructive: {
    d: 'h-[52px] rounded-full bg-tgr/15 px-7 text-[16px] font-bold text-tgrl shadow-[inset_0_0_0_1.5px_rgba(196,85,58,.6)] hover:bg-tgr/25 active:bg-tgr active:text-tgt',
    p: 'h-[52px] rounded-full bg-tgr px-7 text-[16px] font-bold text-tgt scale-[.97]',
    x: 'h-[52px] rounded-full bg-tg1 px-7 text-[16px] font-bold text-tgm/50',
  },
  icon: {
    d: 'h-12 w-12 rounded-full bg-tg1 text-tgt hover:bg-tg2 active:scale-95',
    p: 'h-12 w-12 rounded-full bg-tg2 text-tga scale-95 shadow-[inset_0_0_0_1.5px_#D9A066]',
    x: 'h-12 w-12 rounded-full bg-tgx text-tgm/40',
  },
  fab: {
    d: 'h-16 w-16 rounded-full bg-tga text-tg0 shadow-[0_8px_24px_rgba(217,160,102,.35)] hover:bg-[#E3AE78] active:scale-95',
    p: 'h-16 w-16 rounded-full bg-tgad text-tg0 scale-95 shadow-[0_2px_8px_rgba(217,160,102,.3)]',
    x: 'h-16 w-16 rounded-full bg-tg2 text-tgm/50',
  },
};

export function Btn({ v: tur = 'primary', state = 'default', className = '', children, ...rest }) {
  const k = state === 'pressed' ? 'p' : state === 'disabled' ? 'x' : 'd';
  return (
    <button className={`${base} ${v[tur][k]} ${className}`} disabled={state === 'disabled'}
      aria-pressed={state === 'pressed' ? true : undefined} {...rest}>
      {children}
    </button>
  );
}

// Chip: açıkken sıcak krem dolgu, kapalıyken yüzey
export function Chip({ on, state = 'default', children, onClick }) {
  const dis = state === 'disabled';
  const pr = state === 'pressed';
  const cls = dis
    ? 'bg-tgx text-tgm/40'
    : on
    ? `${pr ? 'bg-tgad' : 'bg-tga/90'} text-tg0`
    : `${pr ? 'bg-tg2 text-tgt' : 'bg-tg1 text-tgm hover:text-tgt'}`;
  return (
    <button onClick={onClick} disabled={dis} aria-pressed={!!on}
      className={`inline-flex h-9 items-center gap-2 rounded-full px-4 text-[14px] font-semibold transition-colors ${cls} ${pr ? 'scale-[.97]' : ''}`}>
      {on && !dis && <span className="h-[6px] w-[6px] rounded-full bg-tg0/60" />}
      {children}
    </button>
  );
}

// Toggle: geniş yuvarlak kızak, açıkken sage
export function Toggle({ on, state = 'default', onClick, label = 'Anahtar' }) {
  const dis = state === 'disabled';
  const pr = state === 'pressed';
  return (
    <button role="switch" aria-checked={!!on} aria-label={label} disabled={dis} onClick={onClick}
      className={`relative h-8 w-[54px] rounded-full transition-colors ${dis ? 'bg-tgx' : on ? 'bg-tgs' : 'bg-tg2'}`}>
      <span
        className={`absolute top-1 h-6 rounded-full shadow-[0_2px_6px_rgba(0,0,0,.3)] transition-all ${pr ? 'w-8' : 'w-6'} ${
          dis ? 'left-1 bg-tg2' : on ? `${pr ? 'left-[18px]' : 'left-[26px]'} bg-tgt` : 'left-1 bg-tgm'
        }`}
      />
    </button>
  );
}
