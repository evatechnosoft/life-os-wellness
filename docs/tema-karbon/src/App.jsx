import { useState } from 'react';
import { directions } from './directions.js';

export default function App() {
  const [aktif, setAktif] = useState(new URLSearchParams(location.search).get('d') || 'd1'); // ?d=d2 for direct links
  const yon = directions.find((d) => d.id === aktif);
  const Comp = yon?.comp;

  return (
    <div className="min-h-screen bg-[#0b0b0c]">
      <header className="sticky top-0 z-50 border-b border-neutral-800 bg-[#0b0b0c]/95">
        <div className="flex flex-wrap items-center gap-6 px-8 py-4">
          <div className="flex items-baseline gap-3">
            <span className="font-grotesk text-lg font-semibold text-neutral-100">Fitness Takip</span>
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-500">
              Tasarım yönleri
            </span>
          </div>
          <nav role="tablist" aria-label="Tasarım yönü" className="flex gap-2">
            {directions.map((d) => {
              const on = d.id === aktif;
              return (
                <button
                  key={d.id}
                  role="tab"
                  aria-selected={on}
                  disabled={!d.comp}
                  onClick={() => setAktif(d.id)}
                  className={`flex items-center gap-3 rounded-md border px-4 py-2 text-left transition-colors ${
                    on
                      ? 'border-neutral-300 bg-neutral-100 text-neutral-900'
                      : 'border-neutral-800 text-neutral-300 hover:border-neutral-600'
                  } disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  <span className="font-mono text-[11px] tracking-widest">{d.kod}</span>
                  <span className="font-grotesk text-sm font-semibold">{d.ad}</span>
                  <span className={`hidden text-xs md:inline ${on ? 'text-neutral-600' : 'text-neutral-500'}`}>
                    {d.not}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="overflow-x-auto px-8 py-10">
        {Comp ? <Comp /> : null}
      </main>
    </div>
  );
}
