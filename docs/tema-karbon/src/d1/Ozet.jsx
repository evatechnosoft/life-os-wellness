import { c } from '../theme.js';
import { useState } from 'react';
import { ozet, kiloSerisi, fmt } from '../data/mock.js';
import { StatusBar, Header, Label, BottomNav, Gauge, Segmented } from './parts.jsx';
import { Btn } from './buttons.jsx';
import { IChevron } from './icons.jsx';

function Sparkline({ data }) {
  const w = 120, h = 36;
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data
    .map((d, i) => `${(i / (data.length - 1)) * w},${h - ((d - min) / (max - min)) * (h - 4) - 2}`)
    .join(' ');
  return (
    <svg width={w} height={h} aria-hidden="true">
      <polyline points={pts} fill="none" stroke={c.kg} strokeWidth="2" strokeLinejoin="miter" />
      <rect x={w - 4} y={2} width="4" height="4" fill={c.kg} />
    </svg>
  );
}

function Row({ label, children, right }) {
  return (
    <div className="flex items-center justify-between border-b border-k3 px-5 py-3">
      <Label>{label}</Label>
      <div className="flex items-baseline gap-2">{children}</div>
      {right}
    </div>
  );
}

export default function Ozet() {
  const [per, setPer] = useState('Gün');
  const d = ozet[per];
  const kalan = d.protein.max - d.protein.v;
  const metrikler = [
    { k: 'Kalori', m: d.kalori },
    { k: 'Adım', m: d.adim },
  ];

  return (
    <div className="h-full bg-k0 font-plex text-kt">
      <StatusBar />
      <Header
        ust="Salı · 14 Ekim"
        baslik="Özet"
        sag={<div className="w-[180px]"><Segmented size="sm" items={['Gün', 'Hafta', 'Ay']} value={per} onChange={setPer} /></div>}
      />

      {/* One Big Thing */}
      <section className="carbon-weave relative mx-5 rounded-lg border border-k3 p-5">
        <div className="flex items-center justify-between">
          <Label className="text-ko">● Şimdi tek iş</Label>
          <Label>Protein</Label>
        </div>
        <div className="mt-4 flex items-end gap-2">
          <span className="font-grotesk text-[64px] font-semibold leading-[0.85] tracking-tight">{d.protein.v}</span>
          <span className="pb-1 font-mono text-[15px] text-km">/ {d.protein.max} g</span>
        </div>
        <div className="mt-4"><Gauge v={d.protein.v} max={d.protein.max} accent /></div>
        <p className="mt-4 text-[15px] leading-snug text-kt">
          {kalan > 0 ? <>Öğlede <b className="font-semibold">43 g</b> ile hedefe {kalan} g kalır.</> : 'Hedef tamam.'}
        </p>
        <Btn className="mt-4 w-full">Öğleyi kaydet · 43 g</Btn>
      </section>

      {/* Enstrüman paneli */}
      <section className="mt-5 border-t border-k3" aria-label="Metrikler">
        {metrikler.map(({ k, m }) => (
          <div key={k} className="border-b border-k3 px-5 py-3">
            <div className="mb-2 flex items-baseline justify-between">
              <Label>{k}</Label>
              <span className="font-grotesk text-[18px] font-medium">
                {fmt(m.v)}
                <span className="ml-1 font-mono text-[12px] text-km">/ {fmt(m.max)} {m.unit}</span>
              </span>
            </div>
            <Gauge v={m.v} max={m.max} />
          </div>
        ))}

        <div className="flex items-center justify-between border-b border-k3 px-5 py-3">
          <div className="flex flex-col gap-1">
            <Label>Kilo · {d.kilo.label}</Label>
            <span className="font-grotesk text-[22px] font-semibold text-kg">
              {d.kilo.v}<span className="ml-1 font-mono text-[12px] text-km">{d.kilo.unit}</span>
            </span>
          </div>
          <Sparkline data={kiloSerisi} />
        </div>

        <div className="grid grid-cols-3 border-b border-k3">
          {[
            ['Uyku', d.uyku, 'sa'],
            ['Dinl. nabız', d.nabiz, 'bpm'],
            ['Antrenman', `${d.antrenman.v}/${d.antrenman.max}`, per === 'Ay' ? 'ay' : 'hf'],
          ].map(([l, v, u], i) => (
            <div key={l} className={`px-5 py-3 ${i ? 'border-l border-k3' : ''}`}>
              <Label>{l}</Label>
              <div className="mt-1 font-grotesk text-[22px] font-semibold leading-none">
                {v}<span className="ml-1 font-mono text-[11px] font-normal text-km">{u}</span>
              </div>
            </div>
          ))}
        </div>
        <Row label="Haftalık rapor" right={<IChevron size={14} className="text-km" />}>{null}</Row>
      </section>

      <BottomNav aktif={0} />
    </div>
  );
}
