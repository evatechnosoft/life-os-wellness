import Phone from './Phone.jsx';
import { Btn } from './controls.jsx';
import { PCheck, PArrow } from './icons.jsx';
import { USER, FLOW, SESSION } from '../data.js';

const STUB = { done: '#E9E8E1', now: '#FF2D9B', next: '#F4F4F0' };

// One flow item = one torn ticket stub. Left: time slot, right: body.
function Ticket({ f, i }) {
  const now = f.s === 'now', done = f.s === 'done';
  return (
    <li
      className={`ticket slide blk grid grid-cols-[78px_1fr] min-h-[64px] ${now ? 'blk-sh -rotate-1 my-2' : ''}`}
      style={{ background: STUB[f.s], animationDelay: `${i * 60}ms` }}
    >
      <div className={`grid place-items-center f-mono text-[13px] font-bold tnum ${now ? 'bg-p-ink text-p-pink' : ''}`}>
        {f.t}
      </div>
      <span aria-hidden className="ticket-perf left-[78px]" />
      <span aria-hidden className="ticket-notch -top-[11px] left-[69px]" />
      <span aria-hidden className="ticket-notch -bottom-[11px] left-[69px]" />
      <div className="flex items-center gap-3 pl-4 pr-3 py-2">
        <div className="flex-1 min-w-0">
          <p className={`f-anyc uppercase leading-none ${now ? 'text-[24px]' : 'text-[18px]'} ${done ? 'line-through decoration-[3px]' : ''}`}>{f.k}</p>
          <p className="f-mono text-[12px] font-bold tnum mt-1">{f.d}</p>
        </div>
        {done && (
          <span className="w-8 h-8 grid place-items-center bg-p-lime border-[3px] border-p-ink shrink-0">
            <PCheck width={16} height={16} />
          </span>
        )}
        {now && <span className="stamp text-[18px] bg-p-paper" style={{ '--r': '6deg' }}>Açık</span>}
        <span className="sr-only">{done ? 'tamamlandı' : now ? 'şu an' : 'sırada'}</span>
      </div>
    </li>
  );
}

function Flow() {
  const doneN = FLOW.filter((f) => f.s === 'done').length;
  return (
    <section aria-label="Bugünün akışı" className="mt-5">
      <div className="flex items-end justify-between mb-3">
        <span className="tape -rotate-1">Bugünün akışı</span>
        <span className="f-anyx text-[22px] tnum leading-none">{doneN}<span className="f-mono text-[12px]">/{FLOW.length}</span></span>
      </div>
      <ol className="flex flex-col gap-2.5">
        {FLOW.map((f, i) => <Ticket key={f.t + f.k} f={f} i={i} />)}
      </ol>
    </section>
  );
}

// Next session = big admission ticket with tear-off footer.
function NextSession() {
  return (
    <section aria-label="Sıradaki seans" className="blk blk-sh mt-8 bg-p-cyan overflow-hidden">
      <div className="halftone absolute inset-0 pointer-events-none" aria-hidden />
      <header className="relative flex items-stretch border-b-[3px] border-p-ink">
        <p className="f-mono text-[11px] font-bold uppercase px-3 py-2 flex-1">Sıradaki seans · giriş bileti</p>
        <p className="f-anyx text-[20px] tnum px-3 py-1.5 bg-p-ink text-p-cyan">{SESSION.time}</p>
      </header>
      <div className="relative px-3 pt-3">
        <h2 className="f-anyx text-[34px] uppercase leading-[0.9]">{SESSION.title}</h2>
        <ul className="mt-3 border-[3px] border-p-ink bg-p-paper">
          {SESSION.items.map((x, i) => (
            <li key={x.n} className="grid grid-cols-[28px_1fr_auto_auto] items-center gap-2 px-2 py-2 border-b-[3px] border-p-ink last:border-b-0">
              <span className="f-anyx text-[18px] tnum">{i + 1}</span>
              <span className="text-[15px] font-semibold">{x.n}</span>
              <span className="f-mono text-[13px] font-bold tnum">{x.s}</span>
              <span className="f-mono text-[13px] font-bold tnum bg-p-lime border-2 border-p-ink px-1.5 min-w-[60px] text-right">{x.w}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="relative mt-4 border-t-[3px] border-dotted border-p-ink px-3 py-3 bg-p-paper">
        <div className="flex items-center justify-between mb-3">
          <span className="f-mono text-[11px] font-bold uppercase">Süre · {SESSION.dur}</span>
          <span className="f-mono text-[11px] font-bold uppercase tnum">No. 0418</span>
        </div>
        <Btn className="w-full" icon={PArrow}>Seansı başlat</Btn>
      </div>
    </section>
  );
}

export default function TakipPhone() {
  return (
    <Phone label="02 · Takip" navActive="plan">
      <header className="pt-4">
        <p className="f-mono text-[12px] uppercase font-bold">{USER.date} · Plan</p>
        <h1 className="kinetic f-anyx text-[44px] uppercase leading-[0.9] mt-1">Takip</h1>
      </header>
      <Flow />
      <NextSession />
    </Phone>
  );
}
