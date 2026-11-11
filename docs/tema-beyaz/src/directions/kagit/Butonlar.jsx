import { Primary, Secondary, Ghost, Destructive, IconBtn } from './buttons.jsx';
import { KagitAdd } from './parts.jsx';
import { Chip, Toggle, Segment } from './controls.jsx';

const STATES = ['Varsayılan', 'Basılı', 'Pasif'];
const st = (i) => ({ pressed: i === 1, disabled: i === 2 });

const ROWS = [
  { ad: 'Birincil', not: 'Terrakota hap', r: (i) => <Primary {...st(i)} /> },
  { ad: 'İkincil', not: 'Mürekkep çerçeve', r: (i) => <Secondary {...st(i)} /> },
  { ad: 'Metin', not: 'Altı çizili', r: (i) => <Ghost {...st(i)} /> },
  { ad: 'Yıkıcı', not: 'Kiremit çerçeve', r: (i) => <Destructive {...st(i)} /> },
  { ad: 'İkon', not: '48 × 48', r: (i) => <IconBtn {...st(i)} /> },
  { ad: 'Ekle (FAB)', not: 'Gezinme ortası', r: (i) => <KagitAdd {...st(i)} /> },
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
    not: 'Zeytin açık',
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
        aria-label="Kâğıt buton seti"
        className="paper-grain bg-paper text-ink font-isans w-[600px] min-h-[844px] rounded-[32px] ring-1 ring-ink/20 px-8 py-8"
      >
        <header className="pb-5 border-b-2 border-ink">
          <p className="text-[11px] uppercase tracking-[0.2em] text-ink/60">Bileşen sayfası · L1</p>
          <h2 className="font-fraunces text-[40px] leading-none mt-2 tracking-tight">
            Butonlar<span className="text-terra">.</span>
          </h2>
          <p className="text-[14px] text-ink/70 mt-2 max-w-[420px] leading-snug">
            Gölge yok. Tek vurgu terrakota; geri kalanı mürekkep çizgi ve tipografi.
          </p>
        </header>

        <table className="w-full mt-2">
          <thead>
            <tr className="border-b hair">
              <th scope="col" className="w-[132px]" />
              {STATES.map((s, i) => (
                <th key={s} scope="col" className="py-3 text-left text-[11px] uppercase tracking-[0.16em] text-ink/60 font-normal">
                  <span className="tnum mr-1.5">{String(i + 1).padStart(2, '0')}</span>
                  {s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.ad} className="border-b hair align-middle">
                <th scope="row" className="py-4 pr-3 text-left font-normal align-top">
                  <span className="block font-fraunces text-[18px] leading-tight">{row.ad}</span>
                  <span className="block text-[12px] text-ink/60 mt-0.5">{row.not}</span>
                </th>
                {STATES.map((s, i) => (
                  <td key={s} className="py-4 pr-3">{row.r(i)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6">
          <p className="font-fraunces text-[18px]">Bölümlü seçici</p>
          <p className="text-[12px] text-ink/60 mb-3">Kılçık çizgi üstünde, terrakota alt çizgi</p>
          <div className="grid grid-cols-3 gap-4">
            {STATES.map((s, i) => (
              <div key={s}>
                <p className="text-[11px] uppercase tracking-[0.16em] text-ink/60 mb-2">{s}</p>
                <Segment value="Hafta" onChange={() => {}} pressedIdx={i === 1 ? 2 : -1} disabled={i === 2} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </figure>
  );
}
