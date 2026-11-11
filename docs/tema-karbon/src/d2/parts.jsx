import { c } from '../theme.js';
import { navItems } from '../data/mock.js';
import { IGunes, ITakvim, IOlcu, IKocY, IArti } from './icons.jsx';

const navIcons = [IGunes, ITakvim, IOlcu, IKocY];

export function StatusBar() {
  return (
    <div className="flex h-[47px] items-end justify-between px-8 pb-2 text-[14px] font-semibold text-tgt">
      <span>14:02</span>
      <span className="flex items-center gap-2 text-[12px] text-tgm">
        <span>5G</span>
        <span className="relative inline-block h-[12px] w-[24px] rounded-[4px] border border-tgm/70">
          <span className="absolute inset-y-[2px] left-[2px] w-[12px] rounded-[2px] bg-tgt" />
        </span>
      </span>
    </div>
  );
}

// Küçük harfli, geniş aralıklı üst etiket (D1'in mono BÜYÜK etiketinden farklı)
export function Eyebrow({ children, className = '' }) {
  return <span className={`text-[13px] font-medium text-tgm ${className}`}>{children}</span>;
}

export function Header({ ust, baslik, sag }) {
  return (
    <div className="flex items-end justify-between px-6 pb-5 pt-3">
      <div className="flex flex-col gap-1">
        <Eyebrow>{ust}</Eyebrow>
        <h1 className="font-serif text-[40px] leading-[1] text-tgt">{baslik}</h1>
      </div>
      {sag}
    </div>
  );
}

// Hazırlık: renk + kelime + sayı her zaman birlikte
export const hazirlikSeviye = (n) =>
  n >= 75 ? { kelime: 'Hazır', renk: c.tgs } : n >= 55 ? { kelime: 'Dengeli', renk: c.tga } : { kelime: 'Dinlen', renk: c.tgr };

export function Hazirlik({ n, buyuk = false }) {
  const s = hazirlikSeviye(n);
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full ${buyuk ? 'px-4 py-2' : 'px-3 py-[6px]'}`}
      style={{ background: `${s.renk}22`, boxShadow: `inset 0 0 0 1px ${s.renk}55` }}
      aria-label={`Hazırlık ${s.kelime} ${n}`}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: s.renk }} />
      <span className={`${buyuk ? 'text-[15px]' : 'text-[13px]'} font-semibold`} style={{ color: s.renk }}>
        {s.kelime}
      </span>
      <span className={`${buyuk ? 'text-[15px]' : 'text-[13px]'} font-bold text-tgt`}>{n}</span>
    </div>
  );
}

// Haftalık ısı şeridi – 7 kare
const gunler = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
export function IsiSeridi({ degerler, bugun = 1 }) {
  const ton = (v) =>
    v === null ? 'transparent' : [c.tg2, '#5A4532', '#8A6440', c.tgad, c.tga][v];
  return (
    <div className="grid grid-cols-7 gap-2" role="list" aria-label="Haftalık yoğunluk">
      {degerler.map((v, i) => (
        <div key={i} role="listitem" className="flex flex-col items-center gap-2" aria-label={`${gunler[i]} ${v ?? 'boş'}`}>
          <span
            className={`aspect-square w-full rounded-[10px] ${v === null ? 'border border-dashed border-tg2' : ''} ${
              i === bugun ? 'ring-2 ring-tgt ring-offset-2 ring-offset-tg1' : ''
            }`}
            style={{ background: ton(v) }}
          />
          <span className={`text-[11px] font-semibold ${i === bugun ? 'text-tgt' : 'text-tgm'}`}>{gunler[i]}</span>
        </div>
      ))}
    </div>
  );
}

// Hap şeklinde segmented kontrol
export function Segmented({ items, value, onChange, disabled }) {
  return (
    <div role="tablist" className={`flex rounded-full bg-tg1 p-1 ${disabled ? 'opacity-45' : ''}`}>
      {items.map((it) => {
        const on = it === value;
        return (
          <button
            key={it}
            role="tab"
            aria-selected={on}
            disabled={disabled}
            onClick={() => onChange?.(it)}
            className={`h-8 flex-1 rounded-full px-3 text-[13px] font-semibold transition-colors duration-200 ${
              on ? 'bg-tgt text-tg0' : 'text-tgm hover:text-tgt'
            } disabled:cursor-not-allowed`}
          >
            {it}
          </button>
        );
      })}
    </div>
  );
}

// Alt navigasyon: sıcak yüzey bandı, ortada yükseltilmiş amber "tohum" ekle düğmesi
export function BottomNav({ aktif = 0, onAdd }) {
  const Item = ({ ad, i }) => {
    const Ic = navIcons[i];
    const on = i === aktif;
    return (
      <button
        aria-label={ad}
        aria-current={on ? 'page' : undefined}
        className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors ${on ? 'text-tga' : 'text-tgm hover:text-tgt'}`}
      >
        <Ic size={22} />
        <span className={`text-[11px] ${on ? 'font-bold' : 'font-medium'}`}>{ad}</span>
      </button>
    );
  };
  return (
    <nav className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-tg1 pb-[26px] shadow-[0_-12px_32px_rgba(0,0,0,.35)]">
      <div className="flex h-[68px] items-stretch px-2">
        {navItems.slice(0, 2).map((ad, i) => <Item key={ad} ad={ad} i={i} />)}
        <div className="relative flex w-[84px] justify-center">
          <button
            onClick={onAdd}
            aria-label="Kayıt ekle"
            className="absolute -top-6 flex h-[64px] w-[64px] items-center justify-center rounded-full bg-tga text-tgon shadow-[0_8px_24px_rgba(217,160,102,.35)] ring-[6px] ring-tg0 transition-transform active:scale-95 active:bg-tgad"
          >
            <IArti size={24} />
          </button>
        </div>
        {navItems.slice(2).map((ad, i) => <Item key={ad} ad={ad} i={i + 2} />)}
      </div>
    </nav>
  );
}
