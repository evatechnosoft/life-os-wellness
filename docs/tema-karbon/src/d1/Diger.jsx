import { useState } from 'react';
import { digerListe } from '../data/mock.js';
import { StatusBar, Header, Label, BottomNav } from './parts.jsx';
import { Btn, Toggle } from './buttons.jsx';
import { IChevron, ITrash } from './icons.jsx';

export default function Diger() {
  const [sync, setSync] = useState(true);

  return (
    <div className="h-full bg-k0 font-plex text-kt">
      <StatusBar />
      <Header
        ust="Hesap · Yerel veri"
        baslik="Diğer"
        sag={<span className="rounded-md border border-k3 px-2 py-1 font-mono text-[11px] text-km">v0.4</span>}
      />

      {/* Profil şeridi */}
      <div className="carbon-weave mx-5 flex items-center gap-4 rounded-lg border border-k3 p-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-ko font-grotesk text-[18px] font-bold text-kon">
          EK
        </span>
        <div className="flex flex-1 flex-col">
          <span className="font-grotesk text-[17px] font-semibold">Emre K.</span>
          <span className="font-mono text-[11px] text-km">81,98 kg · Hedef 78,0 kg</span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Label>Senk.</Label>
          <Toggle on={sync} onClick={() => setSync(!sync)} label="Senkronizasyon" />
        </div>
      </div>

      <ul className="mt-5 border-t border-k3" aria-label="Diğer menü">
        {digerListe.map((it, i) => (
          <li key={it.id}>
            <button className="group flex w-full items-center gap-4 border-b border-k3 px-5 py-[11px] text-left hover:bg-k1 active:bg-k2">
              <span className="w-6 font-mono text-[11px] text-km group-hover:text-ko">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="flex flex-1 flex-col">
                <span className="text-[15px]">{it.ad}</span>
                <span className="font-mono text-[11px] text-km">{it.alt}</span>
              </span>
              {it.id === 'saat' && <span className="h-[6px] w-[6px] bg-kg" aria-label="Bağlı" />}
              <IChevron size={12} className="text-km group-hover:text-kt" />
            </button>
          </li>
        ))}
      </ul>

      <div className="px-5 pt-4">
        <Btn v="destructive" className="w-full">
          <ITrash size={14} />Veri sil
        </Btn>
      </div>

      <BottomNav aktif={-1} />
    </div>
  );
}
