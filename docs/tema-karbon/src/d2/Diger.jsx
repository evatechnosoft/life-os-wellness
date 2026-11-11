import { useState } from 'react';
import { digerListe } from '../data/mock.js';
import { StatusBar, Header, Hazirlik, BottomNav } from './parts.jsx';
import { Btn, Toggle } from './buttons.jsx';
import { IOk, ICop, IYaprak } from './icons.jsx';

// Gruplar: tek liste yerine iki sakin bölüm
const gruplar = [
  { ad: 'Antrenman ve beslenme', ids: ['hedef', 'kutuphane', 'tabak', 'shake'] },
  { ad: 'Uygulama', ids: ['hatirlatma', 'saat', 'disa', 'ayar'] },
];

// Her öğe için küçük renkli taş
const tas = {
  hedef: '#D9A066', kutuphane: '#EDE6DC', tabak: '#7FA88A', shake: '#E3AE78',
  hatirlatma: '#D9A066', saat: '#7FA88A', disa: '#A8998A', ayar: '#A8998A',
};

export default function Diger() {
  const [sync, setSync] = useState(true);

  return (
    <div className="d2 d2-grain relative h-full text-tgt">
      <div className="no-scrollbar h-full overflow-y-auto pb-[120px]">
        <StatusBar />
        <Header ust="Hesap ve araçlar" baslik="Diğer" />

        {/* Profil – sıcak yay arka planlı */}
        <section className="relative mx-6 overflow-hidden rounded-[20px] bg-tg1 p-5">
          <svg className="pointer-events-none absolute -right-10 -top-10 h-[180px] w-[180px] text-tga/15" viewBox="0 0 100 100" aria-hidden="true">
            {Array.from({ length: 24 }).map((_, i) => (
              <rect key={i} x="49" y="4" width="2" height="9" rx="1" fill="currentColor" transform={`rotate(${i * 15} 50 50)`} />
            ))}
          </svg>
          <div className="relative flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-tga font-serif text-[24px] text-tg0">E</span>
            <div className="flex flex-1 flex-col gap-1">
              <span className="font-serif text-[24px] leading-none">Emre K.</span>
              <span className="text-[13px] text-tgm">81,98 kg · hedef 78,0 kg</span>
            </div>
          </div>
          <div className="relative mt-4 flex items-center justify-between">
            <Hazirlik n={72} />
            <label className="flex items-center gap-3 text-[13px] font-semibold text-tgm">
              Senkron
              <Toggle on={sync} onClick={() => setSync(!sync)} label="Senkronizasyon" />
            </label>
          </div>
        </section>

        {gruplar.map((g) => (
          <section key={g.ad} className="mt-6" aria-label={g.ad}>
            <h2 className="mb-2 px-7 text-[13px] font-semibold text-tgm">{g.ad}</h2>
            <ul className="mx-6 overflow-hidden rounded-[20px] bg-tg1">
              {g.ids.map((id, i) => {
                const it = digerListe.find((x) => x.id === id);
                return (
                  <li key={id}>
                    <button className={`group flex w-full items-center gap-4 px-4 py-[14px] text-left transition-colors hover:bg-tg2/50 active:bg-tg2 ${i ? 'border-t border-tg2/60' : ''}`}>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: `${tas[id]}22`, color: tas[id] }}>
                        <IYaprak size={16} />
                      </span>
                      <span className="flex flex-1 flex-col">
                        <span className="text-[16px] font-semibold">{it.ad}</span>
                        <span className="text-[13px] text-tgm">{it.alt}</span>
                      </span>
                      {id === 'saat' && (
                        <span className="rounded-full bg-tgs/15 px-2 py-[2px] text-[11px] font-bold text-tgs">Bağlı</span>
                      )}
                      <IOk size={16} className="text-tgm transition-transform group-hover:translate-x-[2px] group-hover:text-tgt" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        <div className="mx-6 mt-6 flex flex-col gap-2">
          <Btn v="destructive" className="w-full"><ICop size={18} />Veri sil</Btn>
          <p className="text-center text-[12px] text-tgm">Tüm kayıtlar bu cihazdan kalıcı olarak silinir.</p>
        </div>
      </div>
      <BottomNav aktif={-1} />
    </div>
  );
}
