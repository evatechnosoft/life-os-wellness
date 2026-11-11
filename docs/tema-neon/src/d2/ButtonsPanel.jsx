import { Btn, IconBtn, Fab, Chip, Toggle, Segmented } from './controls.jsx';
import { PArrow, PTrash, PPlus, PGear } from './icons.jsx';

const STATES = ['Varsayılan', 'Basılı', 'Pasif'];

const ROWS = [
  { k: 'Birincil', r: (s) => <Btn pressed={s === 1} disabled={s === 2} icon={PArrow}>Başlat</Btn> },
  { k: 'İkincil', r: (s) => <Btn variant="secondary" pressed={s === 1} disabled={s === 2}>Vazgeç</Btn> },
  { k: 'Hayalet', r: (s) => <Btn variant="ghost" pressed={s === 1} disabled={s === 2}>Aktar</Btn> },
  { k: 'Yıkıcı', r: (s) => <Btn variant="danger" pressed={s === 1} disabled={s === 2} icon={PTrash}>Sil</Btn> },
  { k: 'İkon buton', r: (s) => <IconBtn icon={PGear} label="Ayarlar" pressed={s === 1} disabled={s === 2} /> },
  { k: 'FAB', r: (s) => <Fab icon={PPlus} label="Kayıt ekle" pressed={s === 1} disabled={s === 2} /> },
  { k: 'Chip · açık', r: (s) => <Chip on pressed={s === 1} disabled={s === 2}>kg</Chip> },
  { k: 'Chip · kapalı', r: (s) => <Chip pressed={s === 1} disabled={s === 2}>lb</Chip> },
  {
    k: 'Toggle',
    r: (s) => (
      <span className="flex gap-2">
        <Toggle on pressed={s === 1} disabled={s === 2} label="Açık örnek" />
        <Toggle pressed={s === 1} disabled={s === 2} label="Kapalı örnek" />
      </span>
    ),
  },
  {
    k: 'Segmented',
    r: (s) => (
      <div className="w-[200px]">
        <Segmented options={['Gün', 'Hafta', 'Ay']} pressedIdx={s === 1 ? 1 : undefined} disabled={s === 2} label={`Dönem ${STATES[s]}`} />
      </div>
    ),
  },
];

export default function ButtonsPanel() {
  return (
    <figure className="np shrink-0 flex flex-col items-center gap-4">
      <figcaption className="f-mono text-[12px] uppercase tracking-[0.2em] text-[rgba(244,244,240,.74)]">04 · Butonlar</figcaption>
      <section aria-label="Buton durumları" className="relative w-[860px] bg-p-paper border-[3px] border-p-ink overflow-hidden">
        <div className="halftone absolute inset-0 pointer-events-none" aria-hidden />
        <header className="relative flex items-end justify-between px-6 pt-6 pb-4 border-b-[3px] border-p-ink bg-p-lime">
          <div>
            <span className="tape -rotate-1">Neon Afiş · bileşenler</span>
            <h2 className="kinetic f-anyx text-[48px] uppercase leading-[0.9] mt-2">Butonlar</h2>
          </div>
          <span className="stamp text-[22px] bg-p-paper" style={{ '--r': '-6deg' }}>Bas!</span>
        </header>
        <div className="relative grid grid-cols-[150px_repeat(3,1fr)] border-b-[3px] border-p-ink bg-p-ink text-p-paper">
          <span className="f-mono text-[11px] font-bold uppercase px-4 py-2">Bileşen</span>
          {STATES.map((s) => (
            <span key={s} className="f-mono text-[11px] font-bold uppercase px-4 py-2 border-l-[3px] border-p-paper/30">{s}</span>
          ))}
        </div>
        <ul className="relative">
          {ROWS.map((row, i) => (
            <li key={row.k} className="grid grid-cols-[150px_repeat(3,1fr)] border-b-[3px] border-p-ink last:border-b-0" style={{ background: i % 2 ? '#E9E8E1' : '#F4F4F0' }}>
              <span className="f-anyc text-[17px] uppercase px-4 py-4 self-center">{row.k}</span>
              {STATES.map((_, s) => (
                <div key={s} className="px-4 py-4 border-l-[3px] border-p-ink flex items-center min-h-[84px]">
                  {row.r(s)}
                </div>
              ))}
            </li>
          ))}
        </ul>
        <footer className="relative px-6 py-3 border-t-[3px] border-p-ink bg-p-ink text-p-lime f-mono text-[11px] font-bold uppercase">
          Basma = translate(2px, 2px) · gölge kalkar · pasif = kesikli kenar
        </footer>
      </section>
    </figure>
  );
}
