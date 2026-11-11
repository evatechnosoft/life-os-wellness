import { c } from '../theme.js';
// Tek kadran: üç eş merkezli yay, halka değil tik işaretleriyle çizilir (270° açılı)
const BAS = 135; // derece, sol alt
const ARALIK = 270;

function TikYayi({ r, n, oran, renk, uzun, kalin, gecikme }) {
  const dolu = Math.round(Math.min(oran, 1) * n);
  return (
    <g>
      {Array.from({ length: n }).map((_, i) => {
        const a = ((BAS + (ARALIK * i) / (n - 1)) * Math.PI) / 180;
        const x1 = 150 + Math.cos(a) * r, y1 = 150 + Math.sin(a) * r;
        const x2 = 150 + Math.cos(a) * (r - uzun), y2 = 150 + Math.sin(a) * (r - uzun);
        const on = i < dolu;
        const uc = on && i === dolu - 1;
        return (
          <line
            key={i}
            x1={x1} y1={y1} x2={uc ? 150 + Math.cos(a) * (r - uzun - 5) : x2} y2={uc ? 150 + Math.sin(a) * (r - uzun - 5) : y2}
            stroke={on ? renk : c.tg2}
            strokeWidth={uc ? kalin + 1.5 : kalin}
            strokeLinecap="round"
            className={on ? 'd2-tick' : ''}
            style={on ? { animationDelay: `${gecikme + i * 12}ms` } : undefined}
          />
        );
      })}
    </g>
  );
}

export default function Dial({ halkalar, children }) {
  // halkalar: [{ ad, v, max, renk }] dıştan içe
  const ayar = [
    { r: 140, n: 54, uzun: 14, kalin: 3 },
    { r: 116, n: 44, uzun: 11, kalin: 2.6 },
    { r: 95, n: 36, uzun: 9, kalin: 2.2 },
  ];
  return (
    <div className="relative mx-auto h-[300px] w-[300px]">
      <svg viewBox="0 0 300 300" className="h-full w-full" role="img"
        aria-label={halkalar.map((h) => `${h.ad} ${h.v} / ${h.max}`).join(', ')}>
        {halkalar.map((h, i) => (
          <TikYayi key={h.ad} {...ayar[i]} oran={h.v / h.max} renk={h.renk} gecikme={i * 120} />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
      {/* Alt açıklıktaki küçük lejant */}
      <div className="absolute inset-x-0 bottom-1 flex justify-center gap-4">
        {halkalar.map((h) => (
          <span key={h.ad} className="flex items-center gap-[6px] text-[11px] font-semibold text-tgm">
            <span className="h-[6px] w-3 rounded-full" style={{ background: h.renk }} />
            {h.ad}
          </span>
        ))}
      </div>
    </div>
  );
}
