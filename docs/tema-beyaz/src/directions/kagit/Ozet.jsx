import { ozet } from '../../data/mock.js';
import { KagitScreen, Rule, Eyebrow, fmt } from './parts.jsx';
import { Segment } from './controls.jsx';

function Sparkline({ seri, gunler }) {
  const w = 200, h = 64, min = Math.min(...seri) - 0.1, max = Math.max(...seri) + 0.1;
  const pts = seri.map((v, i) => [(i / (seri.length - 1)) * w, h - ((v - min) / (max - min)) * h]);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];
  return (
    <div>
      <svg width="100%" viewBox={`0 -6 ${w} ${h + 12}`} aria-label="7 günlük kilo eğrisi" role="img">
        {[0, h / 2, h].map((y) => (
          <line key={y} x1="0" x2={w} y1={y} y2={y} stroke="#1C1A17" strokeOpacity="0.12" strokeDasharray="2 3" />
        ))}
        <path d={d} fill="none" stroke="#1F5C63" strokeWidth="1.75" />
        {pts.map(([x, y], i) => (
          <rect key={i} x={x - 2} y={y - 2} width="4" height="4" fill={i === pts.length - 1 ? '#E85D3F' : '#1C1A17'} />
        ))}
        <circle cx={last[0]} cy={last[1]} r="7" fill="none" stroke="#E85D3F" strokeWidth="1" />
      </svg>
      <div className="flex justify-between text-[11px] text-ink/55 mt-1 tnum">
        {gunler.map((g, i) => <span key={i}>{g}</span>)}
      </div>
    </div>
  );
}

export default function Ozet() {
  const { protein, kalori, adim, kilo, uyku, nabiz, antrenman } = ozet;
  return (
    <KagitScreen active="Bugün">
      <header className="px-6 pt-2 pb-5">
        <div className="flex items-baseline justify-between">
          <Eyebrow>{ozet.tarih}</Eyebrow>
          <span className="text-[11px] tracking-[0.2em] text-ink/60 tnum">NO. 014</span>
        </div>
        <h1 className="font-fraunces text-[44px] leading-[1] mt-2 tracking-tight">
          Özet<span className="text-terra">.</span>
        </h1>
        <div className="mt-4"><Segment /></div>
      </header>

      {/* Protein — lead story */}
      <section className="px-6 pb-6 border-b hair" aria-label="Protein">
        <div className="flex items-end justify-between">
          <Eyebrow>Protein</Eyebrow>
          <span className="text-[13px] text-ink/60 tnum">%{Math.round((protein.deger / protein.hedef) * 100)}</span>
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="font-fraunces text-[96px] leading-[0.9] font-light tracking-[-0.04em] tnum">{protein.deger}</span>
          <span className="font-fraunces italic text-[22px] text-ink/70 tnum">/ {protein.hedef} {protein.birim}</span>
        </div>
        <div className="mt-3"><Rule value={protein.deger} max={protein.hedef} /></div>
        <p className="text-[14px] text-ink/70 mt-3 leading-snug">
          Öğlen <span className="text-ink font-semibold tnum">43 g</span> ile hedefe{' '}
          <span className="tnum">{protein.hedef - protein.deger - 43}</span> g kalır.
        </p>
      </section>

      {/* Asymmetric two-column: kalori wide, adım narrow */}
      <section className="grid grid-cols-[1.35fr_1fr] border-b hair">
        <div className="px-6 py-5 border-r hair">
          <Eyebrow>Kalori</Eyebrow>
          <p className="font-fraunces text-[40px] leading-none mt-2 tnum">{fmt(kalori.deger)}</p>
          <p className="text-[13px] text-ink/60 mt-1 tnum">/ {fmt(kalori.hedef)} {kalori.birim}</p>
          <div className="mt-3"><Rule value={kalori.deger} max={kalori.hedef} color="#E9C46A" thick={3} /></div>
        </div>
        <div className="px-5 py-5">
          <Eyebrow>Adım</Eyebrow>
          <p className="font-fraunces text-[30px] leading-none mt-3 tnum">{fmt(adim.deger)}</p>
          <p className="text-[13px] text-ink/60 mt-1 tnum">/ {fmt(adim.hedef)}</p>
          <div className="mt-3"><Rule value={adim.deger} max={adim.hedef} color="#5F6F52" /></div>
        </div>
      </section>

      {/* Kilo trend — narrow figure left, chart right */}
      <section className="grid grid-cols-[1fr_1.6fr] gap-4 px-6 py-5 border-b hair" aria-label="Kilo trendi">
        <div>
          <Eyebrow>Kilo · 7 gün</Eyebrow>
          <p className="font-fraunces text-[40px] leading-none mt-2 text-teal tnum">{kilo.trend}</p>
          <p className="font-fraunces italic text-[15px] text-ink/70 mt-1">{kilo.birim}</p>
        </div>
        <Sparkline seri={kilo.seri} gunler={kilo.gunler} />
      </section>

      {/* Footnotes row */}
      <section className="grid grid-cols-3 px-6 py-5">
        {[
          ['Uyku', uyku, 'sa'],
          ['Dinlenme nabzı', nabiz, 'bpm'],
          ['Bu hafta', `${antrenman.yapilan}/${antrenman.hedef}`, 'antr.'],
        ].map(([k, v, u], i) => (
          <div key={k} className={i ? 'pl-4 border-l hair' : 'pr-2'}>
            <p className="text-[11px] uppercase tracking-[0.14em] text-ink/60 leading-tight min-h-[28px]">{k}</p>
            <p className="font-fraunces text-[28px] leading-none mt-1 tnum">{v}</p>
            <p className="text-[12px] text-ink/60 mt-1">{u}</p>
          </div>
        ))}
      </section>
      <div className="flex gap-1.5 px-6 pb-8" aria-label={`${antrenman.yapilan} / ${antrenman.hedef} antrenman`}>
        {Array.from({ length: antrenman.hedef }).map((_, i) => (
          <span key={i} className={`flex-1 h-[3px] ${i < antrenman.yapilan ? 'bg-ink' : 'bg-ink/15'}`} />
        ))}
      </div>
    </KagitScreen>
  );
}
