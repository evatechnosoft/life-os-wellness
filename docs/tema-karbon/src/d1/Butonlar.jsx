import { useState } from 'react';
import { Btn, Chip, Toggle } from './buttons.jsx';
import { Segmented } from './parts.jsx';
import { IPlus, IBolt } from './icons.jsx';

const durumlar = [
  ['default', 'Varsayılan'],
  ['pressed', 'Basılı'],
  ['disabled', 'Pasif'],
];

// Segmented için zorlanmış durum görünümü
function SegState({ state }) {
  if (state === 'disabled')
    return (
      <div className="pointer-events-none flex rounded-lg border border-k2 bg-k0 p-[3px] opacity-50">
        {['Gün', 'Hafta', 'Ay'].map((t, i) => (
          <span key={t} className={`flex h-8 flex-1 items-center justify-center rounded-[5px] font-mono text-[11px] uppercase tracking-[0.1em] text-km ${i === 0 ? 'bg-k2' : ''}`}>{t}</span>
        ))}
      </div>
    );
  if (state === 'pressed')
    return (
      <div className="flex rounded-lg border border-k3 bg-k1 p-[3px]">
        {['Gün', 'Hafta', 'Ay'].map((t, i) => (
          <span key={t} className={`flex h-8 flex-1 items-center justify-center rounded-[5px] font-mono text-[11px] uppercase tracking-[0.1em] ${i === 0 ? 'bg-k3 text-kt' : i === 1 ? 'border border-ko text-ko' : 'text-km'}`}>{t}</span>
        ))}
      </div>
    );
  return <LiveSeg />;
}

function LiveSeg() {
  const [v, setV] = useState('Gün');
  return <Segmented size="sm" items={['Gün', 'Hafta', 'Ay']} value={v} onChange={setV} />;
}

const satirlar = [
  { ad: 'Primary', r: (s) => <Btn state={s} className="w-full">Kaydet</Btn> },
  { ad: 'Secondary', r: (s) => <Btn v="secondary" state={s} className="w-full">Düzenle</Btn> },
  { ad: 'Ghost / metin', r: (s) => <Btn v="ghost" state={s}>Tümünü gör</Btn> },
  { ad: 'Destructive', r: (s) => <Btn v="destructive" state={s} className="w-full">Veri sil</Btn> },
  { ad: 'İkon buton', r: (s) => <Btn v="icon" state={s} aria-label="Hızlı"><IBolt size={16} /></Btn> },
  { ad: 'FAB / Ekle', r: (s) => <Btn v="fab" state={s} aria-label="Ekle"><IPlus size={20} /></Btn> },
  {
    ad: 'Chip',
    r: (s) => (
      <div className="flex flex-wrap gap-2">
        <Chip on state={s}>Açık</Chip>
        <Chip state={s}>Kapalı</Chip>
      </div>
    ),
  },
  {
    ad: 'Toggle',
    r: (s) => (
      <div className="flex gap-3">
        <Toggle on state={s} label="Açık örnek" />
        <Toggle state={s} label="Kapalı örnek" />
      </div>
    ),
  },
  { ad: 'Segmented', r: (s) => <SegState state={s} /> },
];

export default function Butonlar() {
  return (
    <div className="rounded-[16px] border border-k3 bg-k0 font-plex text-kt">
      <div className="flex items-end justify-between border-b border-k3 px-6 py-5">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ko">D1 · Karbon</span>
          <h2 className="font-grotesk text-[28px] font-semibold leading-none tracking-tight">Butonlar</h2>
        </div>
        <span className="font-mono text-[11px] text-km">r 8px · gölge yok</span>
      </div>
      <div className="grid grid-cols-[120px_1fr_1fr_1fr] border-b border-k3 bg-k1">
        <span />
        {durumlar.map(([k, l]) => (
          <span key={k} className="border-l border-k3 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-km">
            {l}
          </span>
        ))}
      </div>
      {satirlar.map((row) => (
        <div key={row.ad} className="grid grid-cols-[120px_1fr_1fr_1fr] border-b border-k3 last:border-0">
          <span className="px-4 py-4 font-mono text-[11px] uppercase tracking-[0.1em] text-km">{row.ad}</span>
          {durumlar.map(([k]) => (
            <div key={k} className="flex items-center border-l border-k3 px-4 py-4">
              {row.r(k)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
