import { navOgeleri } from '../data/mock.js';

/**
 * Shared bottom navigation: Bugün · Plan · [ekle] · Ölçüm · Koç
 * Each direction provides its own add button + visual theme via props.
 */
export default function BottomNav({
  active = 'Bugün',
  addButton,
  theme = {},
  renderItem,
}) {
  const {
    wrap = 'bg-paper border-t hair',
    item = 'text-ink/55',
    itemActive = 'text-ink',
  } = theme;
  const left = navOgeleri.slice(0, 2);
  const right = navOgeleri.slice(2);

  const Item = ({ ad, i }) => {
    const on = ad === active;
    return (
      <button
        type="button"
        aria-current={on ? 'page' : undefined}
        className={`flex-1 h-full flex flex-col items-center justify-center gap-1 ${on ? itemActive : item}`}
      >
        {renderItem ? renderItem({ ad, on, i }) : <span className="text-[12px]">{ad}</span>}
      </button>
    );
  };

  return (
    <nav aria-label="Ana gezinme" className={`relative z-20 shrink-0 h-[92px] pb-[26px] flex items-stretch px-3 ${wrap}`}>
      {left.map((ad, i) => <Item key={ad} ad={ad} i={i} />)}
      <div className="w-[84px] flex items-center justify-center">{addButton}</div>
      {right.map((ad, i) => <Item key={ad} ad={ad} i={i + 2} />)}
      <span className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[134px] h-[5px] rounded-full bg-ink/90" aria-hidden="true" />
    </nav>
  );
}
