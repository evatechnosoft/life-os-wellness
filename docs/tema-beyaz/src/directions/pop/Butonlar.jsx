import { Primary, Secondary, Ghost, Destructive, IconBtn } from './buttons.jsx';
import { PopAdd, Cookie } from './parts.jsx';
import { Chip, Toggle, Segment } from './controls.jsx';

const STATES = ['Varsayılan', 'Basılı', 'Pasif'];
const st = (i) => ({ pressed: i === 1, disabled: i === 2 });

const ROWS = [
  { ad: 'Birincil', not: 'Mürekkep + limon', r: (i) => <Primary {...st(i)} /> },
  { ad: 'İkincil', not: 'Limon + kalın çerçeve', r: (i) => <Secondary {...st(i)} /> },
  { ad: 'Metin', not: 'Kobalt, ok', r: (i) => <Ghost {...st(i)} /> },
  { ad: 'Yıkıcı', not: 'Mercan dolgu', r: (i) => <Destructive {...st(i)} /> },
  { ad: 'İkon', not: 'Squircle → daire', r: (i) => <IconBtn {...st(i)} /> },
  { ad: 'Ekle (FAB)', not: 'Kurabiye rozet', r: (i) => <div className="pt-6"><PopAdd {...st(i)} /></div> },
  {
    ad: 'Çip',
    not: 'Açık / kapalı',
    r: (i) => (
      <div className="flex flex-col items-start gap-2">
        <Chip on {...st(i)}>Protein</Chip>
        <Chip {...st(i)}>Karbonhidrat</Chip>
      </div>
    ),
  },
  {
    ad: 'Anahtar',
    not: 'Büyüyen başparmak',
    r: (i) => (
      <div className="flex flex-col items-start gap-2">
        <Toggle on {...st(i)} label="Açık anahtar" />
        <Toggle {...st(i)} label="Kapalı anahtar" />
      </div>
    ),
  },
];

export default function Butonlar() {
  return (
    <figure className="flex flex-col items-start gap-3 shrink-0">
      <figcaption className="font-isans text-[12px] uppercase tracking-[0.18em] text-ink/60">Butonlar</figcaption>
      <section
        aria-label="Pop buton seti"
        className="pop-root bg-pop-bg text-pop-ink font-flex w-[640px] min-h-[844px] rounded-[48px] ring-2 ring-pop-ink px-8 py-8"
      >
        <header className="flex items-center justify-between gap-4 pb-5">
          <div>
            <p className="pop-label text-[12px] uppercase text-pop-ink/70">Bileşen sayfası · L2</p>
            <h2 className="pop-num text-[64px] leading-[0.85] uppercase mt-1">Butonlar</h2>
            <p className="text-[14px] text-pop-ink/75 mt-2 max-w-[380px] leading-snug">
              56 px gövde. Basınca yay ile %96 küçülür, kapsül köşeleri kare-yuvarlağa döner.
            </p>
          </div>
          <Cookie size={104} lobes={12} fill="#C6F432" label="Bileşen sayısı 9">
            <span className="pop-num text-[44px] leading-none">9</span>
            <span className="pop-label text-[10px]">BİLEŞEN</span>
          </Cookie>
        </header>

        <table className="w-full border-separate border-spacing-y-1">
          <thead>
            <tr>
              <th scope="col" className="w-[132px]" />
              {STATES.map((s, i) => (
                <th key={s} scope="col" className="pb-2 text-left font-normal">
                  <span className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-full pop-label text-[11px] uppercase
                    ${i === 0 ? 'bg-pop-lime' : i === 1 ? 'bg-pop-ink text-pop-lime' : 'bg-pop-ink/10 text-pop-ink/70'}`}>
                    {s}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, ri) => (
              <tr key={row.ad} className={ri % 2 ? '' : 'bg-pop-peach/40'}>
                <th scope="row" className="py-3 pl-3 pr-3 text-left font-normal align-middle rounded-l-[20px]">
                  <span className="block pop-num-md text-[20px] leading-tight uppercase">{row.ad}</span>
                  <span className="block text-[12px] text-pop-ink/65 mt-0.5">{row.not}</span>
                </th>
                {STATES.map((s, i) => (
                  <td key={s} className={`py-3 pr-3 align-middle ${i === 2 ? 'rounded-r-[20px]' : ''}`}>{row.r(i)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6">
          <p className="pop-num-md text-[20px] uppercase">Bölümlü seçici</p>
          <p className="text-[12px] text-pop-ink/65 mb-3">Mürekkep ray, limon yaylı hap</p>
          <div className="grid grid-cols-3 gap-3">
            {STATES.map((s, i) => (
              <div key={s}>
                <p className="pop-label text-[11px] uppercase text-pop-ink/70 mb-2">{s}</p>
                <Segment value="Hafta" onChange={() => {}} pressedIdx={i === 1 ? 2 : -1} disabled={i === 2} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </figure>
  );
}
