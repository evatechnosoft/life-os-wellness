import { useState } from 'react';
import { Btn, Chip, Toggle } from './buttons.jsx';
import { Segmented } from './parts.jsx';
import { IArti, IOynat, ICop, IKalp } from './icons.jsx';

const durumlar = [
  ['default', 'Varsayılan'],
  ['pressed', 'Basılı'],
  ['disabled', 'Pasif'],
];

const segItems = ['Gün', 'Hafta', 'Ay'];

// Segmented: canlı / basılı (ikinci sekmeye parmak inmiş) / pasif
function SegState({ state }) {
  const [v, setV] = useState('Gün');
  if (state === 'disabled') return <Segmented items={segItems} value="Gün" disabled />;
  if (state === 'pressed')
    return (
      <div className="flex rounded-full bg-tg1 p-1" aria-hidden="true">
        {segItems.map((t, i) => (
          <span
            key={t}
            className={`flex h-8 flex-1 items-center justify-center rounded-full px-3 text-[13px] font-semibold ${
              i === 0 ? 'bg-tgt text-tg0' : i === 1 ? 'scale-[.96] bg-tg2 text-tga' : 'text-tgm'
            }`}
          >
            {t}
          </span>
        ))}
      </div>
    );
  return <Segmented items={segItems} value={v} onChange={setV} />;
}

function LiveChips({ state }) {
  const [a, setA] = useState(true);
  const [b, setB] = useState(false);
  const live = state === 'default';
  return (
    <div className="flex flex-wrap gap-2">
      <Chip on={live ? a : true} state={state} onClick={() => setA(!a)}>Tavuk</Chip>
      <Chip on={live ? b : false} state={state} onClick={() => setB(!b)}>Ayran</Chip>
    </div>
  );
}

function LiveToggles({ state }) {
  const [a, setA] = useState(true);
  const [b, setB] = useState(false);
  const live = state === 'default';
  return (
    <div className="flex gap-3">
      <Toggle on={live ? a : true} state={state} onClick={() => setA(!a)} label="Açık örnek" />
      <Toggle on={live ? b : false} state={state} onClick={() => setB(!b)} label="Kapalı örnek" />
    </div>
  );
}

const satirlar = [
  { ad: 'Primary', not: 'amber hap', r: (s) => <Btn state={s} className="w-full"><IOynat size={16} />Başlat</Btn> },
  { ad: 'Secondary', not: 'sage çizgi', r: (s) => <Btn v="secondary" state={s} className="w-full">Düzenle</Btn> },
  { ad: 'Ghost / metin', not: 'altı çizili', r: (s) => <Btn v="ghost" state={s}>Tümünü gör</Btn> },
  { ad: 'Destructive', not: 'pas + ikon', r: (s) => <Btn v="destructive" state={s} className="w-full"><ICop size={16} />Veri sil</Btn> },
  { ad: 'İkon buton', not: '48 px', r: (s) => <Btn v="icon" state={s} aria-label="Favori"><IKalp size={18} /></Btn> },
  { ad: 'FAB / Ekle', not: '64 px tohum', r: (s) => <Btn v="fab" state={s} aria-label="Ekle"><IArti size={24} /></Btn> },
  { ad: 'Chip', not: 'açık / kapalı', r: (s) => <LiveChips state={s} /> },
  { ad: 'Toggle', not: 'sage kızak', r: (s) => <LiveToggles state={s} /> },
  { ad: 'Segmented', not: 'hap ray', r: (s) => <SegState state={s} /> },
];

export default function Butonlar() {
  return (
    <div className="d2 d2-grain overflow-hidden rounded-[28px] text-tgt shadow-[0_24px_60px_rgba(0,0,0,.45)]">
      <div className="flex items-end justify-between px-8 pb-6 pt-8">
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-tgm">D2 · Toprak Gecesi</span>
          <h2 className="font-serif text-[44px] leading-none">Butonlar</h2>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2" aria-label="Palet">
            {['#D9A066', '#7FA88A', '#C4553A', '#EDE6DC', '#3A322C'].map((c) => (
              <span key={c} className="h-5 w-5 rounded-full ring-2 ring-tg0" style={{ background: c }} />
            ))}
          </div>
          <span className="text-[12px] font-medium text-tgm">tam hap · 20 px yüzey · basınca %97</span>
        </div>
      </div>

      <div className="mx-4 mb-4 overflow-hidden rounded-[20px] bg-tg1/60">
        <div className="grid grid-cols-[148px_1fr_1fr_1fr] bg-tg1">
          <span />
          {durumlar.map(([k, l]) => (
            <span key={k} className="px-5 py-3 text-[13px] font-bold text-tgm">
              {l}
            </span>
          ))}
        </div>
        {satirlar.map((row) => (
          <div key={row.ad} className="grid grid-cols-[148px_1fr_1fr_1fr] border-t border-tg2/60">
            <span className="flex flex-col justify-center gap-[2px] px-5 py-5">
              <span className="text-[14px] font-bold">{row.ad}</span>
              <span className="text-[12px] text-tgm">{row.not}</span>
            </span>
            {durumlar.map(([k]) => (
              <div key={k} className="flex items-center px-5 py-5">
                {row.r(k)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
