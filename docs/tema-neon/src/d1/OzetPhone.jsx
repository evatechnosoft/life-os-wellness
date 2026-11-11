import Phone from './Phone.jsx';
import { ACC, Sticker, Marquee, SectionHead, Bar, Card } from './bits.jsx';
import { Segmented } from './controls.jsx';
import { IcFlame, IcShoe, IcMoon, IcHeart, IcBolt } from './icons.jsx';

const fmt = (n) => n.toLocaleString('tr-TR');

function Hero() {
  return (
    <section className="g-wash rise relative rounded-[16px] border-2 border-black p-5 mt-3 overflow-hidden" style={{ boxShadow: '5px 5px 0 #000' }}>
      <div className="flex items-center justify-between">
        <span className="f-mono text-[12px] font-bold uppercase tracking-wider">Protein · bugün</span>
        <Sticker color="#0A0A0A" className="!text-g-lime" rot={4}>%61</Sticker>
      </div>
      <p className="f-bang text-[78px] leading-[0.9] mt-2 tnum" aria-label="92 / 150 gram protein">
        92<span className="text-[34px] align-top ml-1">/150 G</span>
      </p>
      <div className="h-4 mt-3 bg-black/85 border-2 border-black rounded-[4px] overflow-hidden" role="progressbar" aria-valuenow={92} aria-valuemax={150}>
        <div className="h-full bg-g-paper" style={{ width: '61%', backgroundImage: 'repeating-linear-gradient(-45deg,#F4F4F0 0 6px,#d8d8d2 6px 9px)' }} />
      </div>
      <p className="mt-3 f-mono text-[13px] font-bold">58 G KALDI · ÖĞLE 43 G İLE KAPAT</p>
      <svg aria-hidden className="absolute -right-6 -bottom-8 w-40 h-40 opacity-25" viewBox="0 0 100 100">
        <path d="M10 70 Q30 20 50 50 T95 30" stroke="#000" strokeWidth="9" fill="none" strokeLinecap="round" />
      </svg>
    </section>
  );
}

function Fuel() {
  return (
    <Card glow={ACC.pink} className="rise" >
      <SectionHead title="Yakıt" kicker="Kalori" color={ACC.pink} />
      <div className="flex items-end justify-between">
        <p className="f-any text-[44px] font-black leading-none tnum">{fmt(1020)}</p>
        <p className="f-mono text-[13px] text-g-dim tnum pb-1">/ {fmt(2120)} kcal</p>
      </div>
      <div className="mt-3"><Bar value={1020} max={2120} color={ACC.pink} /></div>
      <div className="flex items-center gap-2 mt-4">
        <IcShoe width={22} height={22} className="text-g-pink" />
        <p className="f-any text-[26px] font-extrabold tnum leading-none">{fmt(5760)}</p>
        <p className="f-mono text-[12px] text-g-dim tnum">/ {fmt(8000)} adım</p>
      </div>
      <div className="mt-2"><Bar value={5760} max={8000} color={ACC.pink} /></div>
    </Card>
  );
}

function Trend() {
  const pts = [82.6, 82.4, 82.5, 82.1, 82.0, 81.9, 81.7];
  const min = 81.5, max = 82.8;
  const d = pts.map((v, i) => `${i ? 'L' : 'M'}${(i / 6) * 300} ${((max - v) / (max - min)) * 70 + 5}`).join(' ');
  return (
    <Card glow={ACC.cyan} className="rise">
      <SectionHead title="Kilo trendi" kicker="7 gün" color={ACC.cyan} />
      <p className="f-any text-[44px] font-black leading-none tnum text-g-cyan">−0,4<span className="text-[18px] text-g-ink ml-1">kg/hf</span></p>
      <svg viewBox="0 0 300 80" className="w-full h-20 mt-3" role="img" aria-label="Haftalık kilo düşüş grafiği">
        <path d={`${d} L300 80 L0 80 Z`} fill="rgba(23,225,242,.12)" />
        <path d={d} stroke={ACC.cyan} strokeWidth="4" fill="none" strokeLinejoin="round" />
        <circle cx="300" cy={((max - 81.7) / (max - min)) * 70 + 5} r="6" fill={ACC.cyan} stroke="#000" strokeWidth="2" />
      </svg>
    </Card>
  );
}

const MINI = [
  { k: 'Uyku', v: '6:48', u: 'sa', Ic: IcMoon, c: ACC.lime },
  { k: 'Dinlenme nabzı', v: '61', u: 'bpm', Ic: IcHeart, c: ACC.pink },
  { k: 'Antrenman', v: '4/5', u: 'hafta', Ic: IcBolt, c: ACC.cyan },
];

function Vitals() {
  return (
    <section aria-label="Toparlanma" className="rise">
      <SectionHead title="Toparlanma" kicker="Gece" color={ACC.lime} />
      <ul className="grid grid-cols-[1.2fr_1fr] gap-3">
        {MINI.map((m, i) => (
          <li
            key={m.k}
            className={`bg-g-soft border border-g-edge rounded-[14px] p-3 ${i === 0 ? 'row-span-2 flex flex-col justify-between' : ''}`}
            style={{ borderLeft: `5px solid ${m.c}` }}
          >
            <div className="flex items-center gap-1.5" style={{ color: m.c }}>
              <m.Ic width={18} height={18} />
              <span className="f-mono text-[11px] font-bold uppercase text-g-dim">{m.k}</span>
            </div>
            <p className={`f-any font-black tnum leading-none mt-2 ${i === 0 ? 'text-[48px]' : 'text-[30px]'}`}>
              {m.v}<span className="f-mono text-[12px] text-g-dim font-normal ml-1">{m.u}</span>
            </p>
            {i === 0 && <p className="f-mono text-[11px] text-g-dim mt-2">Hedef 7:30 · −42 dk</p>}
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
          <p className="f-mono text-[12px] uppercase text-g-dim">Salı · 14 Ekim</p>
          <h1 className="f-bang text-[44px] leading-none mt-1">Selam, Deniz!</h1>
        </div>
        <span className="mt-1 inline-flex items-center gap-1 sticker f-mono text-[11px] font-bold bg-g-pink">
          <IcFlame width={14} height={14} /> 12 GÜN
        </span>
      </header>
      <div className="mt-4">
        <Segmented options={['Gün', 'Hafta', 'Ay']} />
      </div>
      <Hero />
      <div className="my-6"><Marquee /></div>
      <div className="flex flex-col gap-4">
        <Fuel />
        <Trend />
        <Vitals />
      </div>
    </Phone>
  );
}
