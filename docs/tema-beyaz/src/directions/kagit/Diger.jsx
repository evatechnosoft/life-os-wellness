import { digerGruplar } from '../../data/mock.js';
import { KagitScreen, Eyebrow } from './parts.jsx';
import { Toggle } from './controls.jsx';

const Ok = () => (
  <svg width="16" height="10" viewBox="0 0 16 10" aria-hidden="true">
    <rect x="0" y="4.25" width="13" height="1.5" fill="currentColor" />
    <path d="M10 0.5 15 5l-5 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

function Oge({ o, n }) {
  const bagli = o.not === 'Bağlı';
  return (
    <li>
      <button
        type="button"
        className="group w-full grid grid-cols-[32px_1fr_auto] items-baseline gap-2 py-3.5 border-b hair text-left hover:bg-ink/[0.03] transition-colors"
      >
        <span className="text-[12px] text-ink/60 tnum">{String(n).padStart(2, '0')}</span>
        <span>
          <span className="block font-fraunces text-[20px] leading-tight group-hover:italic">{o.ad}</span>
          {o.not && (
            <span className={`block text-[13px] mt-0.5 ${bagli ? 'text-olive font-semibold' : 'text-ink/60'}`}>
              {bagli && <span aria-hidden="true" className="inline-block w-1.5 h-1.5 rounded-full bg-olive mr-1.5 align-middle" />}
              {o.not}
            </span>
          )}
        </span>
        <span className="text-ink/50 group-hover:text-terra group-hover:translate-x-0.5 transition-all self-center">
          <Ok />
        </span>
      </button>
    </li>
  );
}

export default function Diger() {
  let n = 0;
  return (
    <KagitScreen active="Koç">
      <header className="px-6 pt-2 pb-5">
        <Eyebrow>Ayarlar ve araçlar</Eyebrow>
        <h1 className="font-fraunces text-[44px] leading-[1] mt-2 tracking-tight">
          Diğer<span className="text-terra">.</span>
        </h1>
      </header>

      {/* Profile line — byline style */}
      <section className="px-6 pb-5 flex items-center gap-4 border-b hair">
        <span className="w-12 h-12 rounded-full bg-teal text-paper font-fraunces italic text-[22px] flex items-center justify-center">
          E
        </span>
        <div className="flex-1">
          <p className="font-fraunces text-[19px] leading-tight">Emre Kaya</p>
          <p className="text-[13px] text-ink/60 tnum">82,1 kg · hedef 78 kg · 31. hafta</p>
        </div>
        <button type="button" className="text-[13px] font-semibold underline underline-offset-4 decoration-ink/40 hover:decoration-terra">
          Düzenle
        </button>
      </section>

      {digerGruplar.map((g) => (
        <section key={g.baslik} className="px-6 pt-6" aria-label={g.baslik}>
          <div className="flex items-baseline gap-3 pb-2 border-b-2 border-ink">
            <h2 className="font-fraunces italic text-[15px]">{g.baslik}</h2>
            <span className="text-[11px] text-ink/60 tnum">{g.ogeler.length} öğe</span>
          </div>
          <ul>
            {g.ogeler.map((o) => <Oge key={o.ad} o={o} n={++n} />)}
          </ul>
        </section>
      ))}

      <section className="px-6 pt-6">
        <div className="flex items-center justify-between py-3 border-b hair">
          <span className="text-[15px]">Akşam retrosu bildirimi</span>
          <Toggle on label="Akşam retrosu bildirimi" />
        </div>
      </section>

      {/* Destructive — isolated, outlined, warning copy */}
      <section className="px-6 pt-10 pb-10" aria-label="Tehlikeli bölge">
        <Eyebrow className="!text-[#A33A22]">Geri alınamaz</Eyebrow>
        <button
          type="button"
          className="mt-3 w-full h-[52px] rounded-full border-2 border-[#A33A22] text-[#A33A22] text-[16px] font-semibold hover:bg-[#A33A22] hover:text-paper active:bg-[#8A2F1B] transition-colors"
        >
          Veri sil
        </button>
        <p className="text-[12px] text-ink/60 mt-3 leading-snug">
          Tüm ölçümler, seanslar ve tabaklar bu cihazdan kalıcı olarak silinir.
        </p>
        <p className="text-[11px] text-ink/50 mt-6 tnum">Sürüm 0.1.4 · Kâğıt</p>
      </section>
    </KagitScreen>
  );
}
