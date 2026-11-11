import Phone from './Phone.jsx';
import { Segmented } from './controls.jsx';
import { PBolt } from './icons.jsx';
import { USER, OZET, fmt } from '../data.js';

const pct = (v, m) => Math.round((v / m) * 100);

// Hero: giant protein numeral bleeding off the right edge.
function Hero() {
  const { v, max } = OZET.protein;
  return (
    <section aria-label={`Protein ${v} / ${max} gram`} className="slide relative mt-5 -mx-5 h-[232px] bg-p-lime border-y-[3px] border-p-ink overflow-hidden">
      <div className="halftone-fade absolute inset-0" aria-hidden />
      <span className="tape absolute top-3 left-5 -rotate-2">Protein · bugün</span>
      <p aria-hidden className="kinetic f-anyx absolute -right-8 top-6 text-[188px] leading-[0.8] tnum">{v}</p>
      <div className="absolute left-5 bottom-4 right-5 flex items-end justify-between">
        <p className="f-mono text-[13px] font-bold tnum leading-tight">
          / {max} G<br />{max - v} G KALDI
        </p>
        <span className="stamp text-[26px] text-p-ink bg-p-paper" style={{ '--r': '-7deg' }}>%{pct(v, max)}</span>
      </div>
    </section>
  );
}

// Bar as a striped poster strip.
function Strip({ v, max, color }) {
  return (
    <div className="h-5 border-[3px] border-p-ink bg-p-paper mt-2" role="progressbar" aria-valuenow={v} aria-valuemax={max}>
      <div className="h-full border-r-[3px] border-p-ink" style={{ width: `${pct(v, max)}%`, background: color }} />
    </div>
  );
}

function Fuel() {
  const { kalori: k, adim: a } = OZET;
  return (
    <div className="relative grid grid-cols-[1.25fr_1fr] mt-6">
      <section className="blk blk-sh p-3 z-[1]">
        <p className="f-mono text-[11px] font-bold uppercase">Kalori</p>
        <p className="f-anyx text-[38px] leading-none tnum mt-1">{fmt(k.v)}</p>
        <p className="f-mono text-[12px] tnum text-p-dim">/ {fmt(k.max)} kcal</p>
        <Strip v={k.v} max={k.max} color="#FF2D9B" />
      </section>
      <section className="blk bg-p-cyan p-3 -ml-[3px] mt-6 rotate-[2deg] halftone">
        <p className="f-mono text-[11px] font-bold uppercase">Adım</p>
        <p className="f-anyx text-[30px] leading-none tnum mt-1">{fmt(a.v)}</p>
        <p className="f-mono text-[12px] tnum">/ {fmt(a.max)}</p>
        <Strip v={a.v} max={a.max} color="#0A0A0A" />
      </section>
    </div>
  );
}

function Trend() {
  const { pts, days, delta, unit } = OZET.trend;
  const min = 81.5, max = 82.8;
  const y = (v) => ((max - v) / (max - min)) * 64 + 6;
  return (
    <section aria-label="Kilo trendi" className="blk mt-7 overflow-hidden">
      <header className="flex items-stretch border-b-[3px] border-p-ink">
        <p className="f-anyc text-[16px] uppercase px-3 py-2 flex-1">Kilo trendi · 7 gün</p>
        <p className="f-anyx text-[22px] tnum px-3 py-1.5 bg-p-ink text-p-lime">{delta}<span className="f-mono text-[11px] ml-1">{unit}</span></p>
      </header>
      <div className="grid grid-cols-7 h-[96px] items-end px-2 pt-2 gap-1.5" role="img" aria-label="Haftalık kilo, 82,6'dan 81,7 kg'a düşüş">
        {pts.map((v, i) => (
          <div key={i} className="flex flex-col items-center gap-1 h-full justify-end">
            <span className="f-mono text-[9px] font-bold tnum">{String(v).replace('.', ',')}</span>
            <i
              className="block w-full border-[3px] border-p-ink border-b-0"
              style={{ height: 76 - y(v), background: i === pts.length - 1 ? '#FF2D9B' : i % 2 ? '#F4F4F0' : '#E9E8E1' }}
            />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 px-2 border-t-[3px] border-p-ink">
        {days.map((d, i) => <span key={i} className="f-mono text-[11px] font-bold text-center py-1">{d}</span>)}
      </div>
    </section>
  );
}

const VITALS = [
  { k: 'Uyku', v: OZET.uyku, u: 'sa', bg: '#0A0A0A', fg: '#C6FF3D' },
  { k: 'Nabız', v: OZET.nabiz, u: 'bpm', bg: '#FF2D9B', fg: '#0A0A0A' },
  { k: 'Antrenman', v: `${OZET.antrenman.v}/${OZET.antrenman.max}`, u: 'hf', bg: '#F4F4F0', fg: '#0A0A0A' },
];

function Vitals() {
  return (
    <section aria-label="Toparlanma" className="mt-7">
      <span className="tape rotate-1 mb-2">Toparlanma · gece</span>
      <ul className="grid grid-cols-3 border-[3px] border-p-ink">
        {VITALS.map((m) => (
          <li key={m.k} className="p-2.5 border-r-[3px] border-p-ink last:border-r-0 min-h-[92px] flex flex-col justify-between" style={{ background: m.bg, color: m.fg }}>
            <span className="f-mono text-[10px] font-bold uppercase">{m.k}</span>
            <span className="f-anyx text-[26px] leading-none tnum">{m.v}</span>
            <span className="f-mono text-[10px] uppercase">{m.u}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function OzetPhone() {
  return (
    <Phone label="01 · Özet" navActive="bugun">
      <header className="pt-4 flex items-start justify-between">
        <div>
          <p className="f-mono text-[12px] uppercase font-bold">{USER.date}</p>
          <h1 className="f-anyx text-[40px] leading-[0.9] uppercase mt-1">Selam,<br />{USER.name}</h1>
        </div>
        <span className="blk bg-p-pink px-2 py-1 f-mono text-[11px] font-bold inline-flex items-center gap-1 rotate-3 mt-2">
          <PBolt width={14} height={14} /> {USER.streak} GÜN
        </span>
      </header>
      <div className="mt-4"><Segmented options={OZET.periods} /></div>
      <Hero />
      <Fuel />
      <Trend />
      <Vitals />
    </Phone>
  );
}
