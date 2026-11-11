import { digerGruplar } from '../../data/mock.js';
import PopScreen, { PopHeader } from './shell.jsx';
import { Tile, Eyebrow, Icon, Cookie } from './parts.jsx';
import { Destructive } from './buttons.jsx';
import { Toggle } from './controls.jsx';

const SWATCH = ['bg-pop-lime', 'bg-pop-peach', 'bg-pop-coral', 'bg-pop-cobalt text-white', 'bg-pop-fill text-pop-lime'];
const SHAPE = ['rounded-full', 'rounded-[12px]', 'rounded-[12px] rotate-45', 'rounded-full', 'rounded-[12px]'];

function Item({ o, i }) {
  return (
    <li>
      <button type="button" className="pop-spring w-full flex items-center gap-3 h-[60px] px-2 rounded-[20px] hover:bg-pop-ink/5 text-left">
        <span className={`w-10 h-10 shrink-0 flex items-center justify-center ${SWATCH[i % 5]} ${SHAPE[i % 5]}`} aria-hidden="true">
          <span className={`pop-num text-[16px] ${i % 5 === 2 ? '-rotate-45' : ''}`}>{String(i + 1).padStart(2, '0')}</span>
        </span>
        <span className="flex-1 min-w-0">
          <span className="block pop-label text-[16px]">{o.ad}</span>
          {o.not && <span className="block text-[13px] text-pop-ink/65">{o.not}</span>}
        </span>
        <Icon name="chevron" size={18} className="text-pop-ink/60" />
      </button>
    </li>
  );
}

export default function Diger() {
  let n = 0;
  return (
    <PopScreen active="Koç">
      <PopHeader kicker="Profil ve ayarlar" title="Diğer" />

      <Tile className="bg-pop-fill text-white flex items-center gap-4" shape="rounded-[32px] rounded-br-[12px]">
        <Cookie size={72} lobes={10} depth={0.09} fill="#C6F432">
          <span className="pop-num text-[28px] text-pop-ink">EK</span>
        </Cookie>
        <div className="flex-1">
          <p className="pop-num-md text-[26px] leading-none uppercase">Emre Kaya</p>
          <p className="pop-label text-[12px] text-white/75 mt-1">Hedef 78 kg · 4/5 seri</p>
        </div>
      </Tile>

      {digerGruplar.map((g) => (
        <section key={g.baslik} className="mt-5" aria-label={g.baslik}>
          <Eyebrow className="px-2 mb-1 text-pop-ink/70">{g.baslik}</Eyebrow>
          <ul className="grid">
            {g.ogeler.map((o) => <Item key={o.ad} o={o} i={n++} />)}
          </ul>
        </section>
      ))}

      <div className="mt-3 flex items-center justify-between px-2 h-[56px] rounded-[20px] bg-pop-peach">
        <span className="pop-label text-[15px] pl-2">Otomatik senkron</span>
        <Toggle on label="Otomatik senkron" />
      </div>

      <div className="mt-6">
        <Destructive className="w-full">Veri sil</Destructive>
        <p className="text-center text-[12px] text-pop-ink/60 mt-3 pop-label">Sürüm 0.1.4</p>
      </div>
    </PopScreen>
  );
}
