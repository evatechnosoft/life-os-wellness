/* L2 · Pop — shared visual parts */

export function scallopPath(size = 100, lobes = 12, depth = 0.07) {
  const c = size / 2;
  const r = c / (1 + depth);
  const pts = [];
  const N = 240;
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * Math.PI * 2;
    const rr = r * (1 + depth * Math.cos(lobes * t));
    pts.push(`${(c + rr * Math.cos(t - Math.PI / 2)).toFixed(2)},${(c + rr * Math.sin(t - Math.PI / 2)).toFixed(2)}`);
  }
  return `M${pts.join('L')}Z`;
}

/** Scalloped "cookie" badge. Optional ring shows progress (0..1). */
export function Cookie({ size = 120, lobes = 12, depth = 0.07, fill = '#C6F432', ring, ringColor = '#121212', className = '', children, label }) {
  const d = scallopPath(100, lobes, depth);
  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }} role={label ? 'img' : undefined} aria-label={label}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" aria-hidden="true">
        <path d={d} fill={fill} />
        {ring != null && (
          <circle
            cx="50" cy="50" r="38" fill="none" stroke={ringColor} strokeWidth="7" strokeLinecap="round"
            pathLength="100" strokeDasharray={`${ring * 100} 100`} transform="rotate(-90 50 50)"
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

/** Thick capsule progress bar */
export function Capsule({ value, max, color = '#C6F432', track = 'rgba(18,18,18,0.08)', h = 20, label }) {
  const p = Math.min(1, value / max);
  return (
    <div
      role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}
      className="w-full rounded-full overflow-hidden relative" style={{ height: h, background: track }}
    >
      <div className="h-full rounded-full" style={{ width: `${p * 100}%`, background: color }} />
      <span className="absolute top-1/2 -translate-y-1/2 w-[6px] h-[6px] rounded-full bg-pop-ink/30" style={{ left: `calc(${p * 100}% + 8px)` }} aria-hidden="true" />
    </div>
  );
}

/** Bento tile */
export function Tile({ as: As = 'div', className = '', shape = 'rounded-[28px]', children, ...rest }) {
  return (
    <As className={`relative overflow-hidden p-4 ${shape} ${className}`} {...rest}>
      {children}
    </As>
  );
}

export function Eyebrow({ children, className = '' }) {
  return <p className={`pop-label text-[12px] uppercase tracking-[0.06em] ${className}`}>{children}</p>;
}

/* Chunky filled icon set — 24 grid, heavy 3px strokes, round joins */
const P = {
  plus: <path d="M12 4v16M4 12h16" />,
  check: <path d="M4.5 12.5l5 5L19.5 7" />,
  arrow: <path d="M5 12h13M13 6l6 6-6 6" />,
  chevron: <path d="M9 5l7 7-7 7" />,
  play: <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />,
  bell: <path d="M6 16V11a6 6 0 1112 0v5l2 2H4zM10 21h4" />,
  gear: <><circle cx="12" cy="12" r="3.5" /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" /></>,
  trash: <path d="M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13" />,
  flame: <path d="M12 21c-4 0-6.5-2.6-6.5-6 0-4 3.5-5.5 4-10 3 2 3.5 4.5 3.5 6 1-.6 1.6-1.6 1.8-3 1.6 1.6 3.7 4 3.7 7 0 3.4-2.5 6-6.5 6z" fill="currentColor" />,
  moon: <path d="M19 14.5A7.5 7.5 0 019.5 5a7.5 7.5 0 109.5 9.5z" fill="currentColor" />,
  heart: <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0112 7.3 4.3 4.3 0 0119.5 10c0 5.4-7.5 10-7.5 10z" fill="currentColor" />,
  dumbbell: <path d="M3 9v6M6 6.5v11M18 6.5v11M21 9v6M6 12h12" />,
  more: <><circle cx="5.5" cy="12" r="1.8" fill="currentColor" /><circle cx="12" cy="12" r="1.8" fill="currentColor" /><circle cx="18.5" cy="12" r="1.8" fill="currentColor" /></>,
  close: <path d="M6 6l12 12M18 6L6 18" />,
};

export function Icon({ name, size = 22, stroke = 3, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {P[name]}
    </svg>
  );
}

/* Nav glyphs — solid geometric blobs, unique to Pop */
export function NavGlyph({ i, on }) {
  const shapes = [
    <circle key="0" cx="12" cy="12" r="8" />,
    <rect key="1" x="4" y="4" width="16" height="16" rx="5" />,
    <path key="2" d="M12 3l8.5 15.5h-17z" strokeLinejoin="round" />,
    <path key="3" d={scallopPath(24, 8, 0.12)} />,
  ];
  return (
    <span className={`pop-spring flex items-center justify-center h-8 w-[56px] rounded-full ${on ? 'bg-pop-lime' : ''}`}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill={on ? '#121212' : 'none'} stroke="#121212" strokeWidth="2.5" aria-hidden="true">
        {shapes[i]}
      </svg>
    </span>
  );
}

/** Center add button — lime cookie with ink plus */
export function PopAdd({ pressed, disabled, label = 'Ekle' }) {
  return (
    <button
      type="button" aria-label={label} disabled={disabled} data-pressed={pressed || undefined}
      className="pop-spring relative w-[64px] h-[64px] -mt-6 disabled:opacity-40 disabled:cursor-not-allowed group"
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:rotate-[30deg]" aria-hidden="true">
        <path d={scallopPath(100, 10, 0.08)} fill={disabled ? '#D9D6CE' : '#C6F432'} stroke="#121212" strokeWidth="3" />
      </svg>
      <span className="relative flex items-center justify-center text-pop-ink"><Icon name="plus" size={26} stroke={3.5} /></span>
    </button>
  );
}
