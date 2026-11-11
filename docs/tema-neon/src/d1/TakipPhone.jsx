import Phone from './Phone.jsx';
import { ACC, Sticker, SectionHead, Card } from './bits.jsx';
import { Btn } from './controls.jsx';
import { IcCheck, IcArrow, IcBolt } from './icons.jsx';

const FLOW = [
  { t: '07:10', k: 'Sabah tartısı', d: '81,7 kg', s: 'done' },
  { t: '08:00', k: 'Kahvaltı', d: '31 g protein', s: 'done' },
  { t: '10:30', k: 'Yürüyüş', d: '3.200 adım', s: 'done' },
  { t: 'ŞİMDİ', k: 'Öğle', d: '43 g protein açık', s: 'now' },
  { t: '18:30', k: 'Sırt + Biceps', d: '3 hareket · 45 dk', s: 'next' },
  { t: '22:30', k: 'Akşam retrosu', d: '2 dk not', s: 'next' },
];

function Flow() {
  return (
    <section aria-label="Bugünün akışı" className="rise mt-5">
      <SectionHead title="Bugünün akışı" kicker="3/6" color={ACC.lime} />
      <ol className="relative">
        <span aria-hidden className="absolute left-[60px] top-2 bottom-2 w-[3px] bg-g-edge" />
        {FLOW.map((f) => {
          const now = f.s === 'now', done = f.s === 'done';
          return (
            <li key={f.t + f.k} className="relative grid grid-cols-[52px_20px_1fr] items-center gap-2 py-2">
              <span className={`f-mono text-[12px] font-bold tnum ${now ? 'text-g-pink' : 'text-g-dim'}`}>{f.t}</span>
              <span
                aria-hidden
                className="w-5 h-5 grid place-items-center border-2 border-black z-10 rounded-[4px]"
                style={{ background: done ? ACC.lime : now ? ACC.pink : '#2a2a2a', transform: now ? 'rotate(45deg)' : 'none' }}
              >
                {done && <IcCheck width={12} height={12} className="text-black" />}
              </span>
              {now ? (
                <div className="bg-g-pink text-black border-2 border-black rounded-[10px] px-3 py-2 -rotate-1" style={{ boxShadow: '3px 3px 0 #000' }}>
                  <p className="f-bang text-[24px] leading-none">{f.k}</p>
                  <p className="f-mono text-[12px] font-bold tnum mt-1">{f.d}</p>
                </div>
              ) : (
                <div className={done ? 'opacity-70' : ''}>
                  <p className={`text-[16px] font-semibold ${done ? 'line-through decoration-g-lime decoration-2' : ''}`}>{f.k}</p>
                  <p className="f-mono text-[12px] text-g-dim tnum">{f.d}</p>
                </div>
              )}
              <span className="sr-only">{done ? 'tamamlandı' : now ? 'şu an' : 'sırada'}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

const SESSION = [
  { n: 'Lat pulldown', s: '3×10', w: '45 kg' },
  { n: 'Seated row', s: '3×10', w: '40 kg' },
  { n: 'Biceps curl', s: '2×12', w: '10 kg' },
];

function NextSession() {
  return (
    <Card glow={ACC.cyan} className="rise mt-4">
      <div className="flex items-center justify-between mb-1">
        <span className="f-mono text-[11px] font-bold uppercase text-g-cyan inline-flex items-center gap-1">
          <IcBolt width={14} height={14} /> Sıradaki seans · 18:30
        </span>
        <Sticker color={ACC.cyan}>45 dk</Sticker>
      </div>
      <h2 className="f-bang text-[34px] leading-none mt-1">Sırt + Biceps</h2>
      <ul className="mt-3 divide-y divide-g-edge">
        {SESSION.map((x, i) => (
          <li key={x.n} className="flex items-center py-2.5 gap-3">
            <span className="f-any text-[20px] font-black tnum text-g-cyan w-6">{i + 1}</span>
            <span className="flex-1 text-[16px] font-medium">{x.n}</span>
            <span className="f-mono text-[13px] font-bold tnum">{x.s}</span>
            <span className="f-mono text-[13px] font-bold tnum bg-black border border-g-edge px-2 py-0.5 rounded-[4px] min-w-[62px] text-right">{x.w}</span>
          </li>
        ))}
      </ul>
      <Btn className="w-full mt-4" icon={IcArrow}>Seansı başlat</Btn>
    </Card>
  );
}

export default function TakipPhone() {
  return (
    <Phone label="02 · Takip" navActive="plan">
      <header className="pt-4">
        <p className="f-mono text-[12px] uppercase text-g-dim">Salı · 14 Ekim · Plan</p>
        <h1 className="f-bang text-[44px] leading-none mt-1">
          Takip <span className="text-g-lime">→</span> Şimdi
        </h1>
      </header>
      <Flow />
      <NextSession />
    </Phone>
  );
}
