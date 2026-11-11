import { c } from '../../theme.js';
import { akis, seans } from '../../data/mock.js';
import { KagitScreen, Eyebrow } from './parts.jsx';

const Check = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-label="Tamamlandı" role="img">
    <path d="M1.5 7.5 5.2 11 12.5 2.5" fill="none" stroke={c.olive} strokeWidth="2" strokeLinecap="square" />
  </svg>
);

function Satir({ o, i }) {
  const acik = o.durum === 'acik';
  const tamam = o.durum === 'tamam';
  return (
    <li className={`grid grid-cols-[64px_1fr_auto] items-baseline gap-3 py-4 border-b hair ${acik ? 'relative' : ''}`}>
      {acik && <span aria-hidden="true" className="absolute -left-6 top-0 bottom-0 w-[3px] bg-terra" />}
      <span className={`text-[12px] tracking-[0.12em] tnum ${acik ? 'text-terra font-semibold' : 'text-ink/60'}`}>
        {o.saat}
      </span>
      <div>
        <p className={`font-fraunces leading-tight ${acik ? 'text-[26px]' : 'text-[20px]'} ${tamam ? 'text-ink/60' : 'text-ink'}`}>
          <span className="text-[13px] font-isans text-ink/60 tnum mr-2 align-[3px]">{String(i + 1).padStart(2, '0')}</span>
          {o.baslik}
        </p>
        <p className={`text-[14px] mt-0.5 tnum ${acik ? 'text-ink' : 'text-ink/60'}`}>{o.detay}</p>
      </div>
      <span className="pt-1">
        {tamam ? <Check /> : acik ? (
          <span className="text-[12px] font-semibold underline underline-offset-4 decoration-terra decoration-2">Kaydet</span>
        ) : (
          <span aria-label="Bekliyor" className="block w-3 h-3 rounded-full border border-ink/40" />
        )}
      </span>
    </li>
  );
}

export default function Takip() {
  const tamam = akis.filter((o) => o.durum === 'tamam').length;
  return (
    <KagitScreen active="Plan">
      <header className="px-6 pt-2 pb-4">
        <div className="flex items-baseline justify-between">
          <Eyebrow>Bugünün akışı</Eyebrow>
          <span className="text-[12px] text-ink/60 tnum">{tamam} / {akis.length}</span>
        </div>
        <h1 className="font-fraunces text-[44px] leading-[1] mt-2 tracking-tight">
          Takip<span className="text-terra">.</span>
        </h1>
      </header>

      <ol className="px-6 border-t hair" aria-label="Günün adımları">
        {akis.map((o, i) => <Satir key={o.saat + o.baslik} o={o} i={i} />)}
      </ol>

      {/* Next session — set as a pull-quote block, not a card */}
      <section className="mx-6 mt-6 mb-8 border-t-2 border-ink pt-4" aria-label="Sıradaki seans">
        <div className="flex items-baseline justify-between">
          <Eyebrow>Sıradaki seans</Eyebrow>
          <span className="text-[13px] text-teal font-semibold tnum">{seans.saat}</span>
        </div>
        <h2 className="font-fraunces italic text-[30px] leading-tight mt-1">{seans.ad}</h2>
        <table className="w-full mt-3 text-[15px]">
          <thead className="sr-only">
            <tr><th>Hareket</th><th>Set</th><th>Yük</th></tr>
          </thead>
          <tbody>
            {seans.hareketler.map((h) => (
              <tr key={h.ad} className="border-b hair">
                <td className="py-2.5">{h.ad}</td>
                <td className="py-2.5 text-right text-ink/70 tnum w-16">{h.set}</td>
                <td className="py-2.5 text-right font-semibold tnum w-16">{h.yuk}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          type="button"
          className="mt-5 w-full h-[52px] rounded-full bg-terra text-paper text-[16px] font-semibold hover:bg-[#D9512F] active:bg-[#C9472C] transition-colors"
        >
          Seansı başlat
        </button>
      </section>
    </KagitScreen>
  );
}
