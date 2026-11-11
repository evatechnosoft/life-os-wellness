import { akis, seans } from '../../data/mock.js';
import PopScreen, { PopHeader } from './shell.jsx';
import { Tile, Eyebrow, Icon, Cookie } from './parts.jsx';
import { Primary, IconBtn } from './buttons.jsx';

const done = akis.filter((a) => a.durum === 'tamam').length;

function Row({ a }) {
  const tamam = a.durum === 'tamam';
  const acik = a.durum === 'acik';
  if (acik) {
    return (
      <li className="pop-spring flex items-center gap-3 p-3 pr-4 rounded-[24px] bg-pop-coral border-2 border-pop-ink">
        <span className="h-[44px] px-3 rounded-full bg-pop-ink text-pop-lime pop-num text-[20px] flex items-center">{a.saat}</span>
        <div className="flex-1 min-w-0">
          <p className="pop-num-md text-[24px] leading-none uppercase">{a.baslik}</p>
          <p className="pop-label text-[12px] mt-1">{a.detay}</p>
        </div>
        <button type="button" aria-label={`${a.baslik} ekle`} className="pop-spring w-11 h-11 rounded-[14px] bg-pop-bg border-2 border-pop-ink flex items-center justify-center">
          <Icon name="plus" size={20} />
        </button>
      </li>
    );
  }
  return (
    <li className="flex items-center gap-3 px-1 py-2">
      <span className="w-[52px] pop-num-md text-[18px] text-pop-ink/70">{a.saat}</span>
      <span
        className={`w-8 h-8 shrink-0 flex items-center justify-center ${tamam ? 'bg-pop-lime rounded-full' : 'border-[3px] border-pop-ink/30 rounded-[10px]'}`}
        aria-label={tamam ? 'Tamamlandı' : 'Bekliyor'}
      >
        {tamam && <Icon name="check" size={16} stroke={3.5} />}
      </span>
      <div className="flex-1 min-w-0">
        <p className={`pop-label text-[16px] ${tamam ? 'line-through decoration-2 decoration-pop-ink/40 text-pop-ink/60' : ''}`}>{a.baslik}</p>
        <p className="text-[13px] text-pop-ink/65">{a.detay}</p>
      </div>
    </li>
  );
}

export default function Takip() {
  return (
    <PopScreen active="Plan">
      <PopHeader
        kicker="Günün akışı"
        title="Takip"
        right={
          <Cookie size={64} lobes={9} depth={0.1} fill="#C6F432" label={`${done} / ${akis.length} tamamlandı`}>
            <span className="pop-num text-[22px] leading-none">{done}/{akis.length}</span>
          </Cookie>
        }
      />

      <ol className="grid gap-1">
        {akis.map((a) => <Row key={a.saat + a.baslik} a={a} />)}
      </ol>

      <Tile className="mt-4 bg-pop-cobalt text-white" shape="rounded-[36px] rounded-tl-[12px]">
        <div className="flex items-start justify-between">
          <div>
            <Eyebrow className="text-white/80">Sıradaki seans · {seans.saat}</Eyebrow>
            <h3 className="pop-num text-[40px] leading-[0.9] uppercase mt-1">{seans.ad}</h3>
          </div>
          <IconBtn icon="more" label="Seans seçenekleri" tone="lime" />
        </div>
        <ul className="mt-4 grid gap-2">
          {seans.hareketler.map((h, i) => (
            <li key={h.ad} className="flex items-center gap-3 h-[52px] pl-2 pr-4 rounded-full bg-white/10">
              <span className="w-9 h-9 rounded-full bg-pop-lime text-pop-ink pop-num text-[18px] flex items-center justify-center">{i + 1}</span>
              <span className="flex-1 pop-label text-[15px]">{h.ad}</span>
              <span className="pop-num-md text-[17px] text-pop-lime">{h.set}</span>
              <span className="pop-num-md text-[17px] w-[52px] text-right">{h.yuk}</span>
            </li>
          ))}
        </ul>
        <Primary className="w-full mt-4 !bg-pop-lime !text-pop-ink" icon="play">Seansı başlat</Primary>
      </Tile>
    </PopScreen>
  );
}
