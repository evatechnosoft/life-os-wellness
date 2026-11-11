import { useState } from 'react';
import { IcBugun, IcPlan, IcOlcum, IcKoc, IcPlus } from './icons.jsx';

const NAV = [
  { id: 'bugun', label: 'Bugün', Ic: IcBugun, c: '#C6FF3D' },
  { id: 'plan', label: 'Plan', Ic: IcPlan, c: '#17E1F2' },
  { id: 'add' },
  { id: 'olcum', label: 'Ölçüm', Ic: IcOlcum, c: '#FF2D9B' },
  { id: 'koc', label: 'Koç', Ic: IcKoc, c: '#C6FF3D' },
];

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-7 pt-3 h-11 f-mono text-[13px] font-bold text-g-ink tnum">
      <span>9:41</span>
      <span className="w-[110px] h-[30px] bg-black rounded-full absolute left-1/2 -translate-x-1/2 top-2.5" />
      <span className="flex items-center gap-1.5">
        <span className="flex items-end gap-[2px]" aria-hidden>
          {[5, 7, 9, 11].map((h) => <i key={h} className="w-[3px] bg-g-ink block" style={{ height: h }} />)}
        </span>
        <span className="w-6 h-3 border-2 border-g-ink rounded-[3px] p-[1px]" aria-hidden>
          <i className="block h-full w-3/4 bg-g-lime" />
        </span>
      </span>
    </div>
  );
}

function BottomNav({ active = 'bugun' }) {
  const [cur, setCur] = useState(active);
  return (
    <nav aria-label="Ana gezinme" className="absolute bottom-0 inset-x-0 h-[92px] bg-black border-t-2 border-g-edge px-3 pb-6">
      <ul className="grid grid-cols-5 h-full items-center">
        {NAV.map((n) =>
          n.id === 'add' ? (
            <li key="add" className="flex justify-center">
              <button
                aria-label="Kayıt ekle"
                className="btn-stk -mt-9 w-16 h-16 rotate-[-6deg] bg-g-lime text-black grid place-items-center rounded-[10px]"
              >
                <IcPlus width={30} height={30} />
              </button>
            </li>
          ) : (
            <li key={n.id} className="flex justify-center">
              <button
                onClick={() => setCur(n.id)}
                aria-current={cur === n.id ? 'page' : undefined}
                className="flex flex-col items-center gap-1 min-w-[56px] min-h-[44px] pt-1"
                style={{ color: cur === n.id ? n.c : 'rgba(244,244,240,.74)' }}
              >
                <n.Ic width={22} height={22} />
                <span className={`f-mono text-[11px] font-bold uppercase ${cur === n.id ? 'underline decoration-2 underline-offset-4' : ''}`}>
                  {n.label}
                </span>
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
    <figure className="shrink-0 flex flex-col items-center gap-4">
      <figcaption className="f-mono text-[12px] uppercase tracking-[0.2em] text-g-dim">{label}</figcaption>
      <div
        className="relative w-[390px] h-[844px] rounded-[54px] bg-g-bg overflow-hidden border-[10px] border-[#1c1c1c]"
        style={{ boxShadow: '0 0 0 2px #2a2a2a, 0 40px 80px -20px rgba(0,0,0,.8)' }}
      >
        <div className="spray absolute inset-0 pointer-events-none" />
        <StatusBar />
        <div className="phone-scroll absolute top-11 bottom-[92px] inset-x-0 px-5 pb-8">{children}</div>
        <BottomNav active={navActive} />
      </div>
    </figure>
  );
}
