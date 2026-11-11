import { useState } from 'react';
import { akis, seans } from '../data/mock.js';
import { StatusBar, Header, Label, BottomNav, Gauge } from './parts.jsx';
import { Btn, Chip } from './buttons.jsx';
import { ICheck, IPlay, IClose, IDots } from './icons.jsx';
import Sheet from './Sheet.jsx';

function Mark({ durum }) {
  if (durum === 'tamam')
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-[4px] bg-k3 text-kt">
        <ICheck size={12} />
      </span>
    );
  if (durum === 'acik')
    return <span className="h-5 w-5 rounded-[4px] border-2 border-ko bg-ko/15" />;
  return <span className="h-5 w-5 rounded-[4px] border border-kl" />;
}

export default function Takip() {
  const [acik, setAcik] = useState(true);

  return (
    <div className="h-full bg-k0 font-plex text-kt">
      <StatusBar />
      <Header ust="Bugün · 3/6 tamam" baslik="Takip" sag={<Gauge v={3} max={6} />} />

      {/* Akış: zaman çizelgesi satırları */}
      <ol className="border-t border-k3" aria-label="Bugünün akışı">
        {akis.map((a) => {
          const now = a.durum === 'acik';
          return (
            <li
              key={a.saat + a.baslik}
              className={`relative flex items-center gap-4 border-b border-k3 px-5 py-3 ${now ? 'bg-k1' : ''}`}
            >
              {now && <span className="absolute inset-y-0 left-0 w-[3px] bg-ko" />}
              <span className={`w-12 font-mono text-[12px] ${now ? 'font-semibold text-ko' : 'text-km'}`}>
                {a.saat}
              </span>
              <Mark durum={a.durum} />
              <div className="flex flex-1 flex-col">
                <span className={`text-[15px] ${a.durum === 'tamam' ? 'text-km' : 'text-kt'}`}>{a.baslik}</span>
                <span className="font-mono text-[11px] text-km">{a.detay}</span>
              </div>
              {now && (
                <button onClick={() => setAcik(true)} className="rounded-lg bg-ko px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-k0 active:bg-kod">
                  Kaydet
                </button>
              )}
            </li>
          );
        })}
      </ol>

      {/* Sıradaki seans */}
      <section className="mx-5 mt-5 rounded-lg border border-k3 bg-k1">
        <div className="flex items-center justify-between border-b border-k3 px-4 py-3">
          <div className="flex flex-col">
            <Label>Sıradaki seans · {seans.saat}</Label>
            <span className="font-grotesk text-[18px] font-semibold">{seans.ad}</span>
          </div>
          <button aria-label="Seans seçenekleri" className="flex h-9 w-9 items-center justify-center rounded-lg border border-k3 text-km hover:text-kt">
            <IDots size={14} />
          </button>
        </div>
        {seans.hareketler.map((h, i) => (
          <div key={h.ad} className="grid grid-cols-[20px_1fr_auto_auto] items-baseline gap-3 border-b border-k3 px-4 py-2 last:border-0">
            <span className="font-mono text-[11px] text-km">0{i + 1}</span>
            <span className="text-[14px]">{h.ad}</span>
            <span className="font-grotesk text-[14px]">{h.set}×{h.tekrar}</span>
            <span className="w-14 text-right font-grotesk text-[14px]">{h.kg}<span className="ml-1 font-mono text-[11px] text-km">kg</span></span>
          </div>
        ))}
        <div className="p-3">
          <Btn className="w-full"><IPlay size={14} />Seansı başlat</Btn>
        </div>
      </section>

      <BottomNav aktif={0} onAdd={() => setAcik(true)} />

      <Sheet open={acik} onClose={() => setAcik(false)} title="Öğle kaydı" ust="Şimdi · 14:02">
        <div className="flex items-end justify-between">
          <div className="flex items-end gap-2">
            <span className="font-grotesk text-[56px] font-semibold leading-[0.85]">43</span>
            <span className="pb-1 font-mono text-[14px] text-km">g protein</span>
          </div>
          <div className="text-right">
            <Label>Sonra</Label>
            <div className="font-grotesk text-[18px]">135<span className="font-mono text-[11px] text-km"> / 150 g</span></div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Chip on>Tavuk 180 g</Chip>
          <Chip on>Pilav</Chip>
          <Chip>Ayran</Chip>
          <Chip>Salata</Chip>
        </div>
        <div className="mt-5 grid grid-cols-[auto_1fr] gap-2">
          <Btn v="secondary" onClick={() => setAcik(false)} aria-label="Kapat"><IClose size={14} /></Btn>
          <Btn onClick={() => setAcik(false)}>Kaydet · 43 g</Btn>
        </div>
      </Sheet>
    </div>
  );
}
