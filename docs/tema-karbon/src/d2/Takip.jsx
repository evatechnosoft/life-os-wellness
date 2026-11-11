import { useState } from 'react';
import { akis, seans } from '../data/mock.js';
import { StatusBar, Header, Eyebrow, Hazirlik, BottomNav } from './parts.jsx';
import { Btn, Chip } from './buttons.jsx';
import { ITik, IOynat, IYaprak } from './icons.jsx';

// Yol düğümü: tamam = sage dolu taş, şimdi = amber nabız, sırada = boş halka
function Dugum({ durum }) {
  if (durum === 'tamam')
    return (
      <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-tgs text-tg0">
        <ITik size={14} />
      </span>
    );
  if (durum === 'acik')
    return (
      <span className="relative z-10 flex h-7 w-7 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-tga/30 motion-reduce:animate-none" />
        <span className="h-7 w-7 rounded-full bg-tga shadow-[0_0_0_5px_rgba(217,160,102,.18)]" />
      </span>
    );
  return <span className="relative z-10 h-7 w-7 rounded-full border-2 border-tg2 bg-tg0" />;
}

function SimdiKart({ a, acik, setAcik, kayitli, setKayitli }) {
  const [secim, setSecim] = useState({ Tavuk: true, Bulgur: true, Ayran: false, Salata: false });
  return (
    <div className="rounded-[20px] bg-tg1 p-4 shadow-[0_10px_30px_rgba(0,0,0,.3)]">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[12px] font-bold text-tga">Şimdi · 14:02</span>
          <span className="font-serif text-[26px] leading-none">{a.baslik}</span>
        </div>
        <span className="text-right">
          <span className="font-serif text-[32px] leading-none text-tga">43</span>
          <span className="ml-1 text-[12px] font-semibold text-tgm">g</span>
        </span>
      </div>

      {kayitli ? (
        <p className="mt-4 flex items-center gap-2 text-[14px] font-semibold text-tgs">
          <ITik size={16} />Kaydedildi · gün toplamı 135 / 150 g
        </p>
      ) : acik ? (
        <>
          <p className="mt-3 text-[14px] leading-relaxed text-tgm">
            Tabağında ne var? Kaydedince gün <b className="text-tgt">135 / 150 g</b> olur.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.keys(secim).map((k) => (
              <Chip key={k} on={secim[k]} onClick={() => setSecim({ ...secim, [k]: !secim[k] })}>{k}</Chip>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Btn v="ghost" onClick={() => setAcik(false)}>Sonra</Btn>
            <Btn className="flex-1" onClick={() => setKayitli(true)}>Kaydet · 43 g</Btn>
          </div>
        </>
      ) : (
        <Btn className="mt-4 w-full" onClick={() => setAcik(true)}>Öğleyi kaydet</Btn>
      )}
    </div>
  );
}

export default function Takip() {
  const [acik, setAcik] = useState(true);
  const [kayitli, setKayitli] = useState(false);
  const tamam = akis.filter((a) => a.durum === 'tamam').length + (kayitli ? 1 : 0);

  return (
    <div className="d2 d2-grain relative h-full text-tgt">
      <div className="no-scrollbar h-full overflow-y-auto pb-[120px]">
        <StatusBar />
        <Header ust={`Bugünün yolu · ${tamam} / ${akis.length}`} baslik="Takip" sag={<Hazirlik n={72} />} />

        {/* Günün yolu */}
        <ol className="relative px-6" aria-label="Bugünün akışı">
          <span className="absolute bottom-6 left-[37px] top-3 w-[3px] rounded-full bg-tg2" aria-hidden="true" />
          <span className="absolute left-[37px] top-3 h-[150px] w-[3px] rounded-full bg-tgs/70" aria-hidden="true" />
          {akis.map((a) => {
            const now = a.durum === 'acik';
            const durum = now && kayitli ? 'tamam' : a.durum;
            return (
              <li key={a.saat + a.baslik} className={`relative flex gap-4 ${now ? 'py-3' : 'py-[10px]'}`}>
                <div className="pt-[2px]"><Dugum durum={durum} /></div>
                {now ? (
                  <div className="flex-1">
                    <SimdiKart a={a} acik={acik} setAcik={setAcik} kayitli={kayitli} setKayitli={setKayitli} />
                  </div>
                ) : (
                  <div className="flex flex-1 items-baseline justify-between">
                    <div className="flex flex-col">
                      <span className={`text-[16px] font-semibold ${durum === 'tamam' ? 'text-tgm' : 'text-tgt'}`}>{a.baslik}</span>
                      <span className="text-[13px] text-tgm">{a.detay}</span>
                    </div>
                    <span className="text-[13px] font-semibold text-tgm">{a.saat}</span>
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        {/* Sıradaki seans */}
        <section className="mx-6 mt-4 overflow-hidden rounded-[20px] bg-tg1" aria-label="Sıradaki seans">
          <div className="flex items-end justify-between bg-[radial-gradient(120%_120%_at_100%_0%,rgba(217,160,102,.18),transparent_60%)] px-5 pb-4 pt-5">
            <div className="flex flex-col gap-1">
              <Eyebrow className="flex items-center gap-2"><IYaprak size={14} className="text-tga" />Akşam · {seans.saat}</Eyebrow>
              <span className="font-serif text-[28px] leading-none">{seans.ad}</span>
            </div>
            <span className="text-[13px] font-semibold text-tgm">~45 dk</span>
          </div>
          <ul className="px-5">
            {seans.hareketler.map((h) => (
              <li key={h.ad} className="flex items-center gap-3 border-t border-tg2/70 py-3">
                <span className="flex flex-1 flex-col">
                  <span className="text-[15px] font-semibold">{h.ad}</span>
                  <span className="text-[13px] text-tgm">{h.set} set × {h.tekrar} tekrar</span>
                </span>
                <span className="rounded-full bg-tg2 px-3 py-1 text-[14px] font-bold">
                  {h.kg}<span className="ml-1 text-[11px] font-semibold text-tgm">kg</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="px-5 pb-5 pt-2">
            <Btn className="w-full"><IOynat size={18} />Seansı başlat</Btn>
          </div>
        </section>
      </div>
      <BottomNav aktif={0} onAdd={() => { setAcik(true); setKayitli(false); }} />
    </div>
  );
}
