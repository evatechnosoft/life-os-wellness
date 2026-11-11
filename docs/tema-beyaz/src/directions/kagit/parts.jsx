import BottomNav from '../../components/BottomNav.jsx';

/* Typographic / geometric nav marks — solid, not a thin outline set */
const Mark = ({ ad, on }) => {
  const c = on ? '#E85D3F' : 'currentColor';
  switch (ad) {
    case 'Bugün':
      return (
        <svg width="22" height="14" viewBox="0 0 22 14" aria-hidden="true">
          <path d="M3 13a8 8 0 0 1 16 0z" fill={c} />
          <rect x="0" y="12.5" width="22" height="1.5" fill="currentColor" />
        </svg>
      );
    case 'Plan':
      return (
        <svg width="22" height="14" viewBox="0 0 22 14" aria-hidden="true">
          <rect x="0" y="0" width="22" height="3" fill={c} />
          <rect x="0" y="5.5" width="15" height="3" fill="currentColor" />
          <rect x="0" y="11" width="9" height="3" fill="currentColor" />
        </svg>
      );
    case 'Ölçüm':
      return (
        <svg width="22" height="14" viewBox="0 0 22 14" aria-hidden="true">
          <rect x="0" y="12.5" width="22" height="1.5" fill="currentColor" />
          {[0, 5, 10, 15, 20].map((x, i) => (
            <rect key={x} x={x} y={i % 2 ? 6 : 0} width="2" height={i % 2 ? 7 : 13} fill={i === 2 ? c : 'currentColor'} />
          ))}
        </svg>
      );
    default:
      return (
        <span aria-hidden="true" className="font-fraunces text-[30px] leading-[14px] h-[14px] -mt-1" style={{ color: c }}>
          “
        </span>
      );
  }
};

export function KagitAdd({ pressed = false, disabled = false, size = 56 }) {
  return (
    <button
      type="button"
      aria-label="Ekle"
      disabled={disabled}
      style={{ width: size, height: size }}
      className={`rounded-full flex items-center justify-center transition-transform active:scale-95
        ${pressed ? 'bg-[#C9472C] scale-95' : 'bg-terra hover:bg-[#D9512F]'}
        disabled:bg-ink/10 disabled:text-ink/30 disabled:scale-100 text-paper`}
    >
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
        <rect x="9.5" y="0" width="3" height="22" fill="currentColor" />
        <rect x="0" y="9.5" width="22" height="3" fill="currentColor" />
      </svg>
    </button>
  );
}

export function KagitScreen({ children, active = 'Bugün' }) {
  return (
    <div className="paper-grain bg-paper text-ink h-full flex flex-col font-isans">
      <div className="flex-1 overflow-y-auto scroll-none pt-[56px]">{children}</div>
      <BottomNav
        active={active}
        addButton={<KagitAdd />}
        theme={{ wrap: 'bg-paper border-t hair', item: 'text-ink/50', itemActive: 'text-ink' }}
        renderItem={({ ad, on }) => (
          <>
            <Mark ad={ad} on={on} />
            <span className={`text-[12px] tracking-wide ${on ? 'font-semibold' : ''}`}>{ad}</span>
          </>
        )}
      />
    </div>
  );
}

/* Thin underline progress rule */
export function Rule({ value, max, color = '#E85D3F', thick = 2 }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="relative h-[6px]" role="progressbar" aria-valuenow={value} aria-valuemax={max} aria-valuemin={0}>
      <div className="absolute inset-x-0 bottom-0 h-px bg-ink/15" />
      <div className="absolute left-0 bottom-0" style={{ width: `${pct}%`, height: thick, background: color }} />
      <div className="absolute bottom-0 w-px h-[6px] bg-ink" style={{ left: `${pct}%` }} />
    </div>
  );
}

export const Eyebrow = ({ children, className = '' }) => (
  <p className={`text-[11px] uppercase tracking-[0.2em] text-ink/60 ${className}`}>{children}</p>
);

export const fmt = (n) => n.toLocaleString('tr-TR');
