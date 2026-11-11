import { useState } from 'react';
import { ozet, kiloSerisi, fmt } from '../data/mock.js';
import { StatusBar, Header, Eyebrow, Hazirlik, IsiSeridi, Segmented, BottomNav } from './parts.jsx';
import Dial from './Dial.jsx';
import { IAy, IKalp, IYaprak } from './icons.jsx';

// Haftalık yoğunluk (0–4), bugün henüz boş
const hafta = [3, 0, 4, 1, 3, 4, null];

function Egri({ data }) {
  const w = 72, h = 28;
  const min = Math.min(...data), max = Math.max(...data);
  const p = data.map((d, i) => [(i / (data.length - 1)) * w, h - ((d - min) / (max - min)) * (h - 6) - 3]);
  const path = p.map(([x, y], i) => (i ? `L${x},${y}` : `M${x},${y}`)).join(' ');
  return (
    <svg width={w} height={h} aria-hidden="true">
      <path d={path} fill="none" stroke="#7FA88A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={p[p.length - 1][0]} cy={p[p.length - 1][1]} r="3.5" fill="#7FA88A" />
    </svg>
  );
}

export default function Ozet() {
  const [per, setPer] = useState('Gün');
  const d = ozet[per];
  const halkalar = [
    { ad: 'Protein', v: d.protein.v, max: d.protein.max, renk: '#D9A066' },
    { ad: 'Kalori', v: d.kalori.v, max: d.kalori.max, renk: '#EDE6DC' },
    { ad: 'Adım', v: d.adim.v, max: d.adim.max, renk: '#7FA88A' },
  ];

  return (
    <div className="d2 d2-grain relative h-full text-tgt">
      <div className="no-scrollbar h-full overflow-y-auto pb-[120px]">
        <StatusBar />
        <Header ust="Pazar, 19 Ekim" baslik="İyi günler" sag={<Hazirlik n={72} />} />

        <div className="px-6">
          <Segmented items={['Gün', 'Hafta', 'Ay']} value={per} onChange={setPer} />
        </div>

        {/* Tek kadran */}
        <section className="mt-4" aria-label="Günlük ilerleme">
          <Dial halkalar={halkalar}>
            <Eyebrow>protein</Eyebrow>
            <span className="font-serif text-[64px] leading-[1] text-tgt">{d.protein.v}</span>
            <span className="text-[14px] font-semibold text-tgm">/ {d.protein.max} g</span>
          </Dial>
          <div className="mx-6 mt-3 grid grid-cols-2 gap-2 text-center">
            {[['Kalori', d.kalori, '#EDE6DC'], ['Adım', d.adim, '#7FA88A']].map(([ad, m, c]) => (
              <div key={ad} className="rounded-[20px] bg-tg1/70 px-3 py-3">
                <div className="text-[18px] font-bold leading-none" style={{ color: c }}>{fmt(m.v)}</div>
                <div className="mt-1 text-[12px] font-medium text-tgm">/ {fmt(m.max)} {m.unit}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Gövde sinyalleri – tek yüzey, bölmeli */}
        <section className="mx-6 mt-4 rounded-[20px] bg-tg1">
          <div className="flex items-center justify-between border-b border-tg2/70 px-4 py-4">
            <div className="flex flex-col gap-1">
              <span className="text-[12px] font-semibold text-tgm">Kilo · {d.kilo.label}</span>
              <span className="text-[22px] font-bold leading-none text-tgs">
                {d.kilo.v}<span className="ml-1 text-[12px] font-medium text-tgm">{d.kilo.unit}</span>
              </span>
            </div>
            <Egri data={kiloSerisi} />
          </div>
          <div className="flex divide-x divide-tg2/70">
            <MiniSatir Ic={IAy} renk="#D9A066" etiket="Uyku" deger={d.uyku} birim="sa" />
            <MiniSatir Ic={IKalp} renk="#C4553A" etiket="Dinlenme nabzı" deger={d.nabiz} birim="bpm" />
          </div>
        </section>

        {/* Haftalık ısı şeridi */}
        <section className="mx-6 mt-4 rounded-[20px] bg-tg1 px-4 pb-4 pt-4">
          <div className="mb-4 flex items-baseline justify-between">
            <span className="flex items-center gap-2 text-[14px] font-bold">
              <IYaprak size={16} className="text-tga" />Bu hafta
            </span>
            <span className="text-[14px] font-bold">
              {d.antrenman.v}/{d.antrenman.max}
              <span className="ml-1 text-[12px] font-medium text-tgm">antrenman</span>
            </span>
          </div>
          <IsiSeridi degerler={hafta} bugun={6} />
        </section>
      </div>
      <BottomNav aktif={0} />
    </div>
  );
}

function MiniSatir({ Ic, renk, etiket, deger, birim }) {
  return (
    <div className="flex flex-1 flex-col gap-2 px-4 py-4">
      <span className="flex items-center gap-2 text-[12px] font-semibold text-tgm">
        <span style={{ color: renk }}><Ic size={14} /></span>
        {etiket}
      </span>
      <span className="text-[22px] font-bold leading-none text-tgt">
        {deger}<span className="ml-1 text-[12px] font-medium text-tgm">{birim}</span>
      </span>
    </div>
  );
}
