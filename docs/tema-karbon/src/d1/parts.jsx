import { navItems } from '../data/mock.js';
import { IBugun, IPlan, IOlcum, IKoc, IPlus } from './icons.jsx';

const navIcons = [IBugun, IPlan, IOlcum, IKoc];

export function StatusBar() {
  return (
    <div className="flex h-[47px] items-end justify-between px-8 pb-2 font-mono text-[13px] text-kt tnum">
      <span>14:02</span>
      <span className="flex items-center gap-2 text-[11px] text-km">
        <span>5G</span>
        <span className="relative inline-block h-[11px] w-[22px] border border-km">
          <span className="absolute inset-[1px] right-[8px] bg-kt" />
        </span>
      </span>
    </div>
  );
}

export function Label({ children, className = '' }) {
  return (
    <span className={`font-mono text-[11px] uppercase tracking-[0.12em] text-km ${className}`}>
      {children}
    </span>
  );
}

export function Header({ ust, baslik, sag }) {
  return (
    <div className="flex items-end justify-between px-5 pb-4 pt-2">
      <div className="flex flex-col gap-1">
        <Label>{ust}</Label>
        <h1 className="font-grotesk text-[28px] font-semibold leading-none tracking-tight text-kt">
          {baslik}
        </h1>
      </div>
      {sag}
    </div>
  );
}

// Alt navigasyon: 4 sekme + ortada köşeli turuncu "ekle" bloğu
export function BottomNav({ aktif = 0, onAdd }) {
  const left = navItems.slice(0, 2);
  const right = navItems.slice(2);
  const Item = ({ ad, i }) => {
    const Ic = navIcons[i];
    const on = i === aktif;
    return (
      <button
        aria-label={ad}
        aria-current={on ? 'page' : undefined}
        className={`relative flex h-full flex-1 flex-col items-center justify-center gap-1 ${
          on ? 'text-kt' : 'text-km hover:text-kt'
        }`}
      >
        {on && <span className="absolute top-0 h-[2px] w-8 bg-ko" />}
        <Ic size={18} />
        <span className="font-mono text-[10px] uppercase tracking-[0.1em]">{ad}</span>
      </button>
    );
  };
  return (
    <nav className="absolute inset-x-0 bottom-0 border-t border-k3 bg-k0 pb-[26px]">
      <div className="flex h-[60px] items-stretch">
        {left.map((ad, i) => (
          <Item key={ad} ad={ad} i={i} />
        ))}
        <div className="flex w-[76px] items-center justify-center">
          <button
            onClick={onAdd}
            aria-label="Kayıt ekle"
            className="flex h-11 w-14 items-center justify-center rounded-lg bg-ko text-k0 transition-transform active:scale-95 active:bg-kod"
          >
            <IPlus size={18} />
          </button>
        </div>
        {right.map((ad, i) => (
          <Item key={ad} ad={ad} i={i + 2} />
        ))}
      </div>
    </nav>
  );
}

// İnce enstrüman çubuğu: 24 segmentli ölçek
export function Gauge({ v, max, accent = false }) {
  const n = 24;
  const dolu = Math.round((Math.min(v, max) / max) * n);
  return (
    <div className="flex h-[6px] gap-[2px]" role="presentation">
      {Array.from({ length: n }).map((_, i) => (
        <span
          key={i}
          className={`flex-1 ${i < dolu ? (accent ? 'bg-ko' : 'bg-kt') : 'bg-k3'}`}
        />
      ))}
    </div>
  );
}

export function Segmented({ items, value, onChange, size = 'md' }) {
  const h = size === 'sm' ? 'h-8 text-[11px]' : 'h-9 text-[12px]';
  return (
    <div role="tablist" className="flex rounded-lg border border-k3 bg-k1 p-[3px]">
      {items.map((it) => {
        const on = it === value;
        return (
          <button
            key={it}
            role="tab"
            aria-selected={on}
            onClick={() => onChange?.(it)}
            className={`${h} flex-1 rounded-[5px] px-3 font-mono uppercase tracking-[0.1em] transition-colors ${
              on ? 'bg-k3 text-kt' : 'text-km hover:text-kt'
            }`}
          >
            {it}
          </button>
        );
      })}
    </div>
  );
}
