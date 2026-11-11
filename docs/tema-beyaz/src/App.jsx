import { useState } from 'react';
import { mode } from './theme.js';
import DirectionSwitcher from './components/DirectionSwitcher.jsx';
import KagitDirection from './directions/kagit/index.jsx';
import PopDirection from './directions/pop/index.jsx';

const DIRECTIONS = [
  {
    id: 'kagit',
    code: 'L1',
    name: 'Kâğıt',
    desc: 'Sıcak editoryal — kartsız dergi düzeni, terrakota vurgu, Fraunces rakamlar.',
    View: KagitDirection,
  },
  {
    id: 'pop',
    code: 'L2',
    name: 'Pop',
    desc: 'Ekspresif spor — asimetrik bento, kurabiye rozetler, kalın kapsül barlar, yaylı basış.',
    View: PopDirection,
  },
];

export default function App() {
  const [active, setActive] = useState(new URLSearchParams(location.search).get('d') || 'kagit'); // ?d=pop for direct links
  const dir = DIRECTIONS.find((d) => d.id === active);
  const { View } = dir;

  return (
    <main className="min-h-screen font-isans text-ink bg-canvas">
      <header className="sticky top-0 z-40 bg-canvas/95 border-b border-ink/15">
        <div className="px-10 py-5 flex flex-wrap items-center gap-6 justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-ink/60">Fitness takip · Tasarım yönleri</p>
            <h1 className="font-fraunces text-[28px] leading-tight tracking-tight">
              Tuval<span className="text-terra">.</span>
            </h1>
          </div>
          <DirectionSwitcher directions={DIRECTIONS} active={active} onChange={setActive} />
          <a
            href={`?d=${active}${mode === 'dark' ? '' : '&mode=dark'}`}
            className="text-[13px] uppercase tracking-[0.16em] border border-ink/30 rounded-full px-4 py-2 hover:bg-ink/5"
          >
            {mode === 'dark' ? 'Açık' : 'Koyu'}
          </a>
        </div>
      </header>

      <section className="px-10 pt-8 pb-4 max-w-[760px]">
        <p className="text-[11px] uppercase tracking-[0.2em] text-ink/60 tnum">Yön {dir.code}</p>
        <h2 className="font-fraunces italic text-[44px] leading-none mt-1">{dir.name}</h2>
        <p className="text-[17px] text-ink/70 mt-3 leading-snug">{dir.desc}</p>
      </section>

      <div className="overflow-x-auto px-10 pt-6 pb-16">
        <div className="w-max">
          <View />
        </div>
      </div>
    </main>
  );
}
