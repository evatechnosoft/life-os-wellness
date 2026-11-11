import { c } from '../../theme.js';
import { ozet } from '../../data/mock.js';
import PopScreen, { PopHeader } from './shell.jsx';
import { Cookie, Capsule, Tile, Eyebrow, Icon } from './parts.jsx';
import { Segment } from './controls.jsx';
import { IconBtn } from './buttons.jsx';

const fmt = (n) => n.toLocaleString('tr-TR');

function KiloSpark({ seri }) {
  const min = Math.min(...seri) - 0.1;
  const max = Math.max(...seri);
  return (
    <div className="flex items-end gap-[3px] h-[34px]" aria-hidden="true">
      {seri.map((v, i) => (
        <span
          key={i}
          className={`flex-1 rounded-full ${i === seri.length - 1 ? 'bg-pop-lime' : 'bg-white/35'}`}
          style={{ height: `${20 + ((v - min) / (max - min)) * 80}%` }}
        />
      ))}
    </div>
  );
}

export default function Ozet() {
  const { protein, kalori, adim, kilo, uyku, nabiz, antrenman } = ozet;
  const kalan = protein.hedef - protein.deger;
  return (
    <PopScreen active="Bugün">
      <PopHeader kicker={ozet.tarih} title="Bugün" right={<IconBtn icon="bell" label="Bildirimler" />} />
      <Segment value="Gün" onChange={() => {}} />

      <div className="grid grid-cols-3 auto-rows-[112px] gap-2 mt-3">
        {/* 2×2 hero — protein */}
        <Tile className="col-span-2 row-span-2 bg-pop-lime flex flex-col" shape="rounded-[36px] rounded-tr-[12px]">
          <Eyebrow>Protein</Eyebrow>
          <p className="mt-auto leading-[0.8] flex items-end gap-1">
            <span className="pop-num text-[124px]">{protein.deger}</span>
            <span className="pop-num-md text-[22px] mb-2">/{protein.hedef}{protein.birim}</span>
          </p>
          <div className="mt-3">
            <Capsule value={protein.deger} max={protein.hedef} color="#121212" track="rgba(18,18,18,0.12)" h={22} label="Protein ilerlemesi" />
          </div>
          <p className="pop-label text-[12px] mt-2">{kalan} g kaldı</p>
        </Tile>

        {/* streak cookie */}
        <div className="flex items-center justify-center">
          <Cookie size={108} fill={c['pop-cobalt']} ring={antrenman.yapilan / antrenman.hedef} ringColor="#C6F432"
            label={`Bu hafta ${antrenman.yapilan} / ${antrenman.hedef} antrenman`}>
            <span className="pop-num text-[30px] leading-none text-white">{antrenman.yapilan}/{antrenman.hedef}</span>
            <span className="pop-label text-[10px] text-white/85 mt-0.5">ANTRENMAN</span>
          </Cookie>
        </div>

        {/* kilo trend */}
        <Tile className="bg-pop-fill text-white flex flex-col" shape="rounded-[24px] rounded-bl-[44px]">
          <Eyebrow className="text-white/75">Kilo</Eyebrow>
          <p className="pop-num text-[30px] leading-none mt-1 text-pop-lime">{kilo.trend}</p>
          <p className="pop-label text-[10px] text-white/75">{kilo.birim}</p>
          <div className="mt-auto"><KiloSpark seri={kilo.seri} /></div>
        </Tile>
      </div>

      {/* readiness */}
      <Tile className="mt-2 bg-pop-peach flex items-center gap-4" shape="rounded-[32px]">
        <Cookie size={132} lobes={14} depth={0.08} fill="#FF6B4A" label="Hazırlık: iyi">
          <span className="pop-label text-[11px]">HAZIRLIK</span>
          <span className="pop-num text-[44px] leading-[0.85] uppercase">İyi</span>
        </Cookie>
        <dl className="flex-1 grid gap-3">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-[12px] bg-pop-fill text-pop-lime flex items-center justify-center"><Icon name="moon" size={18} /></span>
            <div><dt className="pop-label text-[11px] text-pop-ink/75">Uyku</dt><dd className="pop-num-md text-[26px] leading-none">{uyku}</dd></div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-full bg-pop-fill text-pop-coral flex items-center justify-center"><Icon name="heart" size={18} /></span>
            <div><dt className="pop-label text-[11px] text-pop-ink/75">Dinlenme nabzı</dt><dd className="pop-num-md text-[26px] leading-none">{nabiz}<span className="text-[13px] ml-1">bpm</span></dd></div>
          </div>
        </dl>
      </Tile>

      {/* kalori + adım capsules */}
      <Tile className="mt-2 bg-pop-tile border-2 border-pop-ink grid gap-4" shape="rounded-[28px]">
        {[
          { ad: 'Kalori', m: kalori, color: '#FF6B4A' },
          { ad: 'Adım', m: adim, color: c['pop-cobalt'] },
        ].map(({ ad, m, color }) => (
          <div key={ad}>
            <div className="flex items-baseline justify-between mb-1.5">
              <Eyebrow>{ad}</Eyebrow>
              <p className="pop-num-md text-[24px] leading-none">
                {fmt(m.deger)}<span className="text-pop-ink/60 text-[15px]"> / {fmt(m.hedef)} {m.birim}</span>
              </p>
            </div>
            <Capsule value={m.deger} max={m.hedef} color={color} h={18} label={`${ad} ilerlemesi`} />
          </div>
        ))}
      </Tile>
    </PopScreen>
  );
}
