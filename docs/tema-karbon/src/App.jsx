import { useState } from 'react';
import { directions } from './directions.js';
import { mode } from './theme.js';

export default function App() {
  const [aktif, setAktif] = useState(new URLSearchParams(location.search).get('d') || 'd1'); // ?d=d2 for direct links
  const yon = directions.find((d) => d.id === aktif);
  const Comp = yon?.comp;

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-50 border-b border-k3 bg-canvas/95">
        <div className="flex flex-wrap items-center gap-6 px-8 py-4">
          <div className="flex items-baseline gap-3">
            <span className="font-grotesk text-lg font-semibold text-kt">Fitness Takip</span>
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-km">
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
                      ? 'border-kt bg-kt text-k0'
                      : 'border-k3 text-kt/80 hover:border-kl'
                  } disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  <span className="font-mono text-[11px] tracking-widest">{d.kod}</span>
                  <span className="font-grotesk text-sm font-semibold">{d.ad}</span>
                  <span className={`hidden text-xs md:inline ${on ? 'text-k0/70' : 'text-km'}`}>
                    {d.not}
                  </span>
                </button>
              );
            })}
          </nav>
          <a
            href={`?d=${aktif}${mode === 'light' ? '' : '&mode=light'}`}
            className="ml-auto rounded-md border border-k3 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-kt hover:border-kl"
          >
            {mode === 'light' ? 'Koyu' : 'Açık'}
          </a>
        </div>
      </header>
      <main className="overflow-x-auto px-8 py-10">
        {Comp ? <Comp /> : null}
      </main>
    </div>
  );
}
