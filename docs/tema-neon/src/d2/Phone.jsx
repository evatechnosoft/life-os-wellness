import { useState } from 'react';
import { PBugun, PPlan, POlcum, PKoc, PPlus } from './icons.jsx';

const NAV = [
  { id: 'bugun', label: 'Bugün', Ic: PBugun, c: '#C6FF3D' },
  { id: 'plan', label: 'Plan', Ic: PPlan, c: '#17E1F2' },
  { id: 'add' },
  { id: 'olcum', label: 'Ölçüm', Ic: POlcum, c: '#FF2D9B' },
  { id: 'koc', label: 'Koç', Ic: PKoc, c: '#C6FF3D' },
];

function StatusBar() {
  return (
    <div className="relative z-10 flex items-center justify-between px-7 pt-3 h-11 f-mono text-[13px] font-bold tnum text-p-ink">
      <span>9:41</span>
      <span className="w-[110px] h-[30px] bg-p-ink rounded-full absolute left-1/2 -translate-x-1/2 top-2.5" />
      <span className="flex items-center gap-1.5" aria-hidden>
        <span className="flex items-end gap-[2px]">
          {[5, 7, 9, 11].map((h) => <i key={h} className="w-[3px] bg-p-ink block" style={{ height: h }} />)}
        </span>
        <span className="w-6 h-3 border-2 border-p-ink p-[1px]">
          <i className="block h-full w-3/4 bg-p-ink" />
        </span>
      </span>
    </div>
  );
}

// Poster nav: ink bar, active tab = full neon block slab.
function BottomNav({ active = 'bugun' }) {
  const [cur, setCur] = useState(active);
  return (
    <nav aria-label="Ana gezinme" className="absolute bottom-0 inset-x-0 h-[92px] bg-p-paper border-t-[3px] border-p-ink pb-6 z-10">
      <ul className="grid grid-cols-5 h-full">
        {NAV.map((n) =>
          n.id === 'add' ? (
            <li key="add" className="flex justify-center items-start">
              <button
                aria-label="Kayıt ekle"
                className="btn-hard -mt-[26px] w-[58px] h-[58px] bg-p-pink text-p-ink grid place-items-center"
              >
                <PPlus width={28} height={28} />
              </button>
            </li>
          ) : (
            <li key={n.id} className="flex border-r-[3px] border-p-ink last:border-r-0 [&:nth-child(2)]:border-r-0">
              <button
                onClick={() => setCur(n.id)}
                aria-current={cur === n.id ? 'page' : undefined}
                className="flex-1 flex flex-col items-center justify-center gap-1 min-h-[44px] transition-colors"
                style={{ background: cur === n.id ? n.c : 'transparent' }}
              >
                <n.Ic width={22} height={22} />
                <span className="f-anyc text-[13px] uppercase tracking-wide">{n.label}</span>
              </button>
            </li>
          )
        )}
      </ul>
    </nav>
  );
}

export default function Phone({ label, children, navActive }) {
  return (
    <figure className="np shrink-0 flex flex-col items-center gap-4">
      <figcaption className="f-mono text-[12px] uppercase tracking-[0.2em] text-[rgba(244,244,240,.74)]">{label}</figcaption>
      <div
        className="relative w-[390px] h-[844px] rounded-[54px] bg-p-paper overflow-hidden border-[10px] border-[#1c1c1c]"
        style={{ boxShadow: '0 0 0 2px #2a2a2a, 0 40px 80px -20px rgba(0,0,0,.8)' }}
      >
        <StatusBar />
        <div className="phone-scroll absolute top-11 bottom-[92px] inset-x-0 px-5 pb-10 overflow-x-hidden">{children}</div>
        <BottomNav active={navActive} />
      </div>
    </figure>
  );
}
