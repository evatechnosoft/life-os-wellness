import { useState } from 'react';
import Phone from './Phone.jsx';
import { Btn, Toggle, Chip } from './controls.jsx';
import { PTarget, PBook, PPlate, PCup, PBell, PWatch, PExport, PGear, PTrash, PArrow } from './icons.jsx';
import { REMIND } from '../data.js';

// Die-cut sticker: flat neon slab peeled onto the sheet, hard shadow.
function Sticker({ Ic, k, d, bg, rot = 0, wide, children }) {
  return (
    <button
      className={`btn-hard text-left p-3 flex flex-col justify-between gap-3 min-h-[118px] ${wide ? 'col-span-2' : ''}`}
      style={{ background: bg, transform: `rotate(${rot}deg)` }}
    >
      <span className="flex items-start justify-between">
        <span className="w-10 h-10 grid place-items-center bg-p-ink shrink-0" style={{ color: bg }}>
          <Ic width={22} height={22} />
        </span>
        {children}
      </span>
      <span>
        <span className="f-anyc text-[20px] uppercase leading-[0.95] block">{k}</span>
        <span className="f-mono text-[11px] font-bold tnum block mt-1">{d}</span>
      </span>
    </button>
  );
}

function Goals() {
  return (
    <section aria-label="Hedefler" className="slide blk blk-sh mt-5 bg-p-lime overflow-hidden">
      <div className="halftone-fade absolute inset-0" aria-hidden />
      <div className="relative p-3">
        <span className="tape -rotate-1">Hedefler · aktif</span>
        <div className="grid grid-cols-2 mt-3 border-[3px] border-p-ink bg-p-paper">
          <div className="p-2.5 border-r-[3px] border-p-ink">
            <p className="f-mono text-[10px] font-bold uppercase">Hedef kilo</p>
            <p className="f-anyx text-[30px] leading-none tnum mt-1">78,0</p>
            <p className="f-mono text-[11px] tnum">81,7 → 78,0 kg</p>
          </div>
          <div className="p-2.5">
            <p className="f-mono text-[10px] font-bold uppercase">Protein / gün</p>
            <p className="f-anyx text-[30px] leading-none tnum mt-1">150</p>
            <p className="f-mono text-[11px] tnum">gram · %61 bugün</p>
          </div>
        </div>
        <div className="h-5 border-[3px] border-t-0 border-p-ink bg-p-paper" role="progressbar" aria-label="Kilo hedefi ilerlemesi" aria-valuenow={38} aria-valuemax={100}>
          <div className="h-full w-[38%] bg-p-ink" />
        </div>
      </div>
    </section>
  );
}

function Sheet() {
  return (
    <section aria-label="Kütüphane" className="mt-7 -mx-5 px-5 py-5 bg-p-sheet border-y-[3px] border-dashed border-p-ink">
      <span className="tape rotate-1 mb-3">Etiket sayfası · kütüphane</span>
      <div className="grid grid-cols-2 gap-3 mt-3">
        <Sticker Ic={PBook} k="Hareket kütüphanesi" d="148 hareket" bg="#FF2D9B" rot={-1.5} wide>
          <span className="f-anyx text-[34px] leading-none tnum">148</span>
        </Sticker>
        <Sticker Ic={PPlate} k="Seans ve Tabak" d="12 şablon" bg="#17E1F2" rot={1.5} />
        <Sticker Ic={PCup} k="Shake ve Dondurma" d="9 tarif" bg="#F4F4F0" rot={-1} />
      </div>
    </section>
  );
}

function Row({ Ic, k, d, right, bg = '#F4F4F0' }) {
  return (
    <li className="flex items-center gap-3 px-3 py-2.5 min-h-[60px] border-b-[3px] border-p-ink last:border-b-0">
      <span className="w-10 h-10 grid place-items-center border-[3px] border-p-ink shrink-0" style={{ background: bg }}>
        <Ic width={20} height={20} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block f-anyc text-[17px] uppercase leading-none">{k}</span>
        {d && <span className="block f-mono text-[11px] font-bold tnum mt-1">{d}</span>}
      </span>
      {right}
    </li>
  );
}

function Settings() {
  return (
    <>
      <section aria-label="Hatırlatmalar" className="blk mt-7">
        <header className="flex items-stretch border-b-[3px] border-p-ink">
          <p className="f-anyc text-[16px] uppercase px-3 py-2 flex-1">Hatırlatmalar</p>
          <p className="f-anyx text-[20px] tnum px-3 py-1.5 bg-p-ink text-p-cyan">{REMIND.length}</p>
        </header>
        <ul>
          {REMIND.map((r) => (
            <Row key={r.k} Ic={PBell} k={r.k} d={r.t} bg="#17E1F2" right={<Toggle on={r.on} label={`${r.k} hatırlatması`} />} />
          ))}
        </ul>
      </section>
      <section aria-label="Bağlantılar ve ayarlar" className="blk blk-sh mt-6 rotate-[0.6deg]">
        <ul>
          <Row Ic={PWatch} k="Saat / Health Connect" d="Son eşitleme 09:38" bg="#C6FF3D"
            right={<span className="f-mono text-[11px] font-bold uppercase bg-p-lime border-[3px] border-p-ink px-1.5 py-0.5">Bağlı</span>} />
          <Row Ic={PExport} k="Veri dışa aktar" d="CSV · JSON" bg="#FF2D9B"
            right={<Btn variant="ghost" className="!h-11 !px-1 !text-[16px]">Aktar</Btn>} />
          <Row Ic={PGear} k="Ayarlar" d="Birim, dil, bildirim"
            right={<PArrow width={20} height={20} />} />
        </ul>
        <div className="flex flex-wrap gap-2 px-3 py-3 border-t-[3px] border-p-ink bg-p-sheet">
          <Chip on>kg</Chip>
          <Chip>lb</Chip>
          <Chip on color="#17E1F2">Türkçe</Chip>
        </div>
      </section>
    </>
  );
}

function DangerZone() {
  const [arm, setArm] = useState(false);
  return (
    <section aria-label="Tehlikeli bölge" className="relative mt-8 border-[3px] border-dashed border-p-ink p-4 bg-[repeating-linear-gradient(-45deg,#F4F4F0_0_12px,#E9E8E1_12px_24px)]">
      <span className="stamp absolute -top-4 right-3 text-[20px] text-p-ink bg-p-pink" style={{ '--r': '5deg' }}>Dikkat</span>
      <p className="f-mono text-[11px] font-bold uppercase">Tehlikeli bölge</p>
      <h2 className="f-anyx text-[32px] uppercase leading-none mt-1">Veri sil</h2>
      <p className="text-[15px] font-medium mt-2">Tüm ölçümler, seanslar ve notlar kalıcı olarak silinir. Geri alınamaz.</p>
      {arm ? (
        <div className="flex gap-3 mt-4">
          <Btn variant="secondary" className="flex-1" onClick={() => setArm(false)}>Vazgeç</Btn>
          <Btn variant="danger" className="flex-1" icon={PTrash}>Evet, sil</Btn>
        </div>
      ) : (
        <Btn variant="danger" className="w-full mt-4" icon={PTrash} onClick={() => setArm(true)}>Veri sil</Btn>
      )}
    </section>
  );
}

export default function DigerPhone() {
  return (
    <Phone label="03 · Diğer" navActive="koc">
      <header className="pt-4 flex items-end justify-between">
        <div>
          <p className="f-mono text-[12px] uppercase font-bold">Profil · Deniz Y.</p>
          <h1 className="kinetic f-anyx text-[44px] uppercase leading-[0.9] mt-1">Diğer</h1>
        </div>
        <span className="w-12 h-12 grid place-items-center bg-p-cyan border-[3px] border-p-ink -rotate-3" aria-hidden>
          <PTarget width={24} height={24} />
        </span>
      </header>
      <Goals />
      <Sheet />
      <Settings />
      <DangerZone />
      <p className="f-mono text-[11px] text-center mt-6">v0.1 · Neon Afiş</p>
    </Phone>
  );
}
