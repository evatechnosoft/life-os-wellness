import { useState } from 'react';
import Phone from './Phone.jsx';
import { ACC, Sticker, SectionHead, Bar, Card } from './bits.jsx';
import { Btn, Toggle, Chip } from './controls.jsx';
import { IcStar, IcBolt, IcFlame, IcHeart, IcArrow, IcGear, IcTrash, IcMoon } from './icons.jsx';

const GOALS = [
  { k: 'Hedef kilo', v: '78,0', u: 'kg', now: 81.7, from: 84.0, to: 78.0 },
  { k: 'Günlük protein', v: '150', u: 'g', now: 92, from: 0, to: 150 },
];

function Goals() {
  return (
    <Card glow={ACC.lime} className="rise mt-5">
      <SectionHead title="Hedefler" kicker="Aktif" color={ACC.lime} />
      <ul className="flex flex-col gap-4">
        {GOALS.map((g) => (
          <li key={g.k}>
            <div className="flex items-end justify-between mb-1.5">
              <span className="text-[16px] font-medium">{g.k}</span>
              <span className="f-any text-[24px] font-black tnum leading-none">{g.v}<span className="f-mono text-[12px] text-g-dim ml-1">{g.u}</span></span>
            </div>
            <Bar value={Math.abs(g.now - g.from)} max={Math.abs(g.to - g.from)} />
          </li>
        ))}
      </ul>
    </Card>
  );
}

const TILES = [
  { k: 'Hareket kütüphanesi', d: '148 hareket', Ic: IcBolt, c: ACC.pink, rot: -2 },
  { k: 'Seans ve Tabak', d: '12 şablon', Ic: IcStar, c: ACC.cyan, rot: 1.5 },
  { k: 'Shake ve Dondurma', d: '9 tarif', Ic: IcFlame, c: ACC.lime, rot: 1 },
];

function Library() {
  return (
    <section aria-label="Kütüphane" className="rise mt-6">
      <SectionHead title="Kütüphane" kicker="Kaydet" color={ACC.pink} />
      <div className="grid grid-cols-2 gap-3">
        {TILES.map((t, i) => (
          <button
            key={t.k}
            className={`text-left border-2 border-black rounded-[12px] p-3 text-black transition-transform hover:-translate-y-0.5 ${i === 0 ? 'col-span-2 flex items-center gap-3' : ''}`}
            style={{ background: t.c, transform: `rotate(${t.rot}deg)`, boxShadow: '3px 3px 0 #000' }}
          >
            <span className="w-11 h-11 grid place-items-center bg-black rounded-[8px] shrink-0" style={{ color: t.c }}>
              <t.Ic width={24} height={24} />
            </span>
            <span className={i === 0 ? '' : 'block mt-3'}>
              <span className="f-bang text-[22px] leading-none block">{t.k}</span>
              <span className="f-mono text-[12px] font-bold tnum">{t.d}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

const REMIND = [
  { k: 'Sabah tartısı', t: '07:00', on: true },
  { k: 'Protein kontrolü', t: '13:00', on: true },
  { k: 'Akşam retrosu', t: '22:30', on: false },
];

function Row({ Ic, c, k, d, right }) {
  return (
    <li className="flex items-center gap-3 py-3 min-h-[56px]">
      <span className="w-10 h-10 grid place-items-center rounded-[8px] border-2 border-black shrink-0" style={{ background: c, color: '#000' }}>
        <Ic width={20} height={20} />
      </span>
      <span className="flex-1">
        <span className="block text-[16px] font-medium">{k}</span>
        {d && <span className="block f-mono text-[12px] text-g-dim tnum">{d}</span>}
      </span>
      {right}
    </li>
  );
}

function Settings() {
  return (
    <section className="rise mt-6 flex flex-col gap-4">
      <Card glow={ACC.cyan}>
        <SectionHead title="Hatırlatmalar" kicker="3" color={ACC.cyan} />
        <ul className="divide-y divide-g-edge">
          {REMIND.map((r) => (
            <Row key={r.k} Ic={IcMoon} c={ACC.cyan} k={r.k} d={r.t} right={<Toggle on={r.on} label={`${r.k} hatırlatması`} />} />
          ))}
        </ul>
      </Card>
      <Card glow={ACC.lime}>
        <SectionHead title="Bağlantılar" kicker="Senkron" color={ACC.lime} />
        <ul className="divide-y divide-g-edge">
          <Row Ic={IcHeart} c={ACC.lime} k="Saat / Health Connect" d="Son eşitleme 09:38" right={<Sticker color={ACC.lime} rot={3}>Bağlı</Sticker>} />
          <Row
            Ic={IcArrow}
            c={ACC.pink}
            k="Veri dışa aktar"
            d="CSV · JSON"
            right={<Btn variant="ghost" className="!h-11 !px-1 !text-[18px]">Aktar</Btn>}
          />
          <Row Ic={IcGear} c={ACC.cyan} k="Ayarlar" d="Birim, dil, tema" right={<IcArrow width={20} height={20} className="text-g-dim" />} />
        </ul>
        <div className="flex flex-wrap gap-2 mt-3">
          <Chip on>kg</Chip>
          <Chip>lb</Chip>
          <Chip on color={ACC.cyan}>Türkçe</Chip>
        </div>
      </Card>
    </section>
  );
}

function DangerZone() {
  const [arm, setArm] = useState(false);
  return (
    <section aria-label="Tehlikeli bölge" className="rise mt-6 border-2 border-dashed border-g-pink rounded-[14px] p-4">
      <p className="f-mono text-[11px] font-bold uppercase text-g-pink">Tehlikeli bölge</p>
      <h2 className="f-bang text-[30px] leading-none mt-1">Veri sil</h2>
      <p className="text-[15px] text-g-dim mt-2">Tüm ölçümler, seanslar ve notlar kalıcı olarak silinir. Geri alınamaz.</p>
      {arm ? (
        <div className="flex gap-2 mt-4">
          <Btn variant="secondary" className="flex-1" onClick={() => setArm(false)}>Vazgeç</Btn>
          <Btn variant="danger" className="flex-1" icon={IcTrash}>Evet, sil</Btn>
        </div>
      ) : (
        <Btn variant="danger" className="w-full mt-4" icon={IcTrash} onClick={() => setArm(true)}>Veri sil</Btn>
      )}
    </section>
  );
}

export default function DigerPhone() {
  return (
    <Phone label="03 · Diğer" navActive="koc">
      <header className="pt-4">
        <p className="f-mono text-[12px] uppercase text-g-dim">Profil · Deniz Y.</p>
        <h1 className="f-bang text-[44px] leading-none mt-1">
          Diğer <span className="text-g-pink">*</span>
        </h1>
      </header>
      <Goals />
      <Library />
      <Settings />
      <DangerZone />
      <p className="f-mono text-[11px] text-g-dim text-center mt-6">v0.1 · Graffiti Sokak</p>
    </Phone>
  );
}
