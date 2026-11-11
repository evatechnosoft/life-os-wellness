import BottomNav from '../../components/BottomNav.jsx';
import { NavGlyph, PopAdd } from './parts.jsx';

/** Pop phone screen: cream bg, scrollable body, chunky bottom nav */
export default function PopScreen({ active = 'Bugün', children }) {
  return (
    <div className="pop-root flex flex-col h-full bg-pop-bg text-pop-ink font-flex">
      <div className="flex-1 overflow-y-auto scroll-none pt-[56px] px-4 pb-6">{children}</div>
      <BottomNav
        active={active}
        addButton={<PopAdd />}
        theme={{ wrap: 'bg-pop-bg border-t-2 border-pop-ink', item: 'text-pop-ink/60', itemActive: 'text-pop-ink' }}
        renderItem={({ ad, on, i }) => (
          <>
            <NavGlyph i={i} on={on} />
            <span className={`pop-label text-[12px] ${on ? '' : 'opacity-80'}`}>{ad}</span>
          </>
        )}
      />
    </div>
  );
}

/** Big headline row used at top of every Pop screen */
export function PopHeader({ kicker, title, right }) {
  return (
    <header className="flex items-end justify-between gap-3 mb-4">
      <div>
        <p className="pop-label text-[13px] text-pop-ink/70">{kicker}</p>
        <h2 className="pop-num text-[56px] leading-[0.9] uppercase">{title}</h2>
      </div>
      {right}
    </header>
  );
}
