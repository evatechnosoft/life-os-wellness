import { Btn, IconBtn, Fab, Chip, Toggle, Segmented } from './controls.jsx';
import { IcPlus, IcArrow, IcTrash, IcGear } from './icons.jsx';
import { Sticker, ACC } from './bits.jsx';

const STATES = ['Varsayılan', 'Basılı', 'Pasif'];
const st = (i) => ({ pressed: i === 1, disabled: i === 2 });

const ROWS = [
  { k: 'Birincil', c: ACC.lime, r: (i) => <Btn {...st(i)} icon={IcArrow}>Başlat</Btn> },
  { k: 'İkincil', c: ACC.cyan, r: (i) => <Btn variant="secondary" {...st(i)}>Düzenle</Btn> },
  { k: 'Metin', c: ACC.lime, r: (i) => <Btn variant="ghost" {...st(i)} className="!px-1">Tümünü gör</Btn> },
  { k: 'Yıkıcı', c: ACC.pink, r: (i) => <Btn variant="danger" {...st(i)} icon={IcTrash}>Veri sil</Btn> },
  { k: 'İkon', c: ACC.cyan, r: (i) => <IconBtn icon={IcGear} label="Ayarlar" {...st(i)} /> },
  { k: 'FAB', c: ACC.lime, r: (i) => <Fab icon={IcPlus} label="Kayıt ekle" {...st(i)} /> },
  { k: 'Chip · kapalı', c: ACC.pink, r: (i) => <Chip {...st(i)}>Sırt</Chip> },
  { k: 'Chip · açık', c: ACC.pink, r: (i) => <Chip on {...st(i)}>Sırt</Chip> },
  { k: 'Toggle', c: ACC.cyan, r: (i) => <Toggle on={i !== 2} {...st(i)} label={`Toggle ${STATES[i]}`} /> },
  {
    k: 'Segmented',
    c: ACC.lime,
    wide: true,
    r: (i) => (
      <div className="w-[220px]">
        <Segmented options={['Gün', 'Hafta', 'Ay']} disabled={i === 2} pressedIdx={i === 1 ? 1 : undefined} label={`Segmented ${STATES[i]}`} />
      </div>
    ),
  },
];

export default function ButtonsPanel() {
  return (
    <section
      aria-label="Butonlar"
      className="shrink-0 w-[860px] self-start mt-[34px] bg-g-bg border-2 border-black rounded-[24px] relative overflow-hidden"
      style={{ boxShadow: '6px 6px 0 #000, 0 0 0 1px rgba(255,255,255,.08)' }}
    >
      <div className="spray absolute inset-0 pointer-events-none" />
      <header className="relative px-8 pt-7 pb-5 border-b-2 border-g-edge flex items-end justify-between">
        <div>
          <p className="f-mono text-[12px] uppercase tracking-[0.2em] text-g-dim">04 · Sistem</p>
          <h2 className="f-bang text-[56px] leading-none mt-1">
            Butonlar<span className="g-text">!</span>
          </h2>
        </div>
        <Sticker color={ACC.pink} rot={-3}>Sticker gölge · 3px</Sticker>
      </header>
      <div className="relative px-8 py-6">
        <div className="grid grid-cols-[150px_repeat(3,1fr)] gap-x-4 pb-3 border-b border-g-edge">
          <span className="f-mono text-[11px] uppercase text-g-dim">Kontrol</span>
          {STATES.map((s, i) => (
            <span key={s} className="f-mono text-[11px] font-bold uppercase" style={{ color: [ACC.lime, ACC.pink, 'rgba(244,244,240,.74)'][i] }}>
              {s}
            </span>
          ))}
        </div>
        <ul>
          {ROWS.map((row) => (
            <li key={row.k} className="grid grid-cols-[150px_repeat(3,1fr)] gap-x-4 items-center py-4 border-b border-g-edge last:border-0">
              <span className="flex items-center gap-2">
                <i className="w-2.5 h-2.5 rotate-45 border border-black" style={{ background: row.c }} aria-hidden />
                <span className="f-mono text-[12px] font-bold uppercase">{row.k}</span>
              </span>
              {STATES.map((s, i) => (
                <div key={s} className="flex items-center min-h-[64px]">{row.r(i)}</div>
              ))}
            </li>
          ))}
        </ul>
        <p className="f-mono text-[11px] text-g-dim mt-4">
          Bangers büyük harf · birincil kireç dolgu + 3px siyah ofset · yıkıcı pembe · ikincil camgöbeği çerçeve · basılıda gölge sıfırlanır
        </p>
      </div>
    </section>
  );
}
