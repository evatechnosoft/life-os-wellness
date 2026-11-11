import { useState } from 'react';
import DirectionSwitcher from './DirectionSwitcher.jsx';
import Direction1 from './d1/Direction1.jsx';
import Direction2 from './d2/Direction2.jsx';

const DIRECTIONS = [
  { id: 'd1', code: 'N1', name: 'Graffiti Sokak', View: Direction1 },
  { id: 'd2', code: 'N2', name: 'Neon Afiş', View: Direction2 },
];

function Pending() {
  return (
    <div className="px-12 pt-16 f-mono text-[14px] text-[rgba(244,244,240,.74)]">Yön 2 bekleniyor.</div>
  );
}

export default function App() {
  const [dir, setDir] = useState(new URLSearchParams(location.search).get('d') || 'd1'); // ?d=d2 for direct links
  const cur = DIRECTIONS.find((d) => d.id === dir);
  const View = cur.View ?? Pending;
  return (
    <div className="min-h-screen bg-[#050505]">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-6 px-12 py-5 bg-[#050505]/90 backdrop-blur border-b border-white/10">
        <div>
          <p className="f-mono text-[11px] uppercase tracking-[0.2em] text-[rgba(244,244,240,.74)]">Fitness Takip · Yön Prototipleri</p>
          <h1 className="text-[20px] font-bold mt-0.5">Yön {cur.code} · {cur.name}</h1>
        </div>
        <DirectionSwitcher directions={DIRECTIONS} value={dir} onChange={setDir} />
      </header>
      <main className="overflow-x-auto">
        <View />
      </main>
    </div>
  );
}
