// Shared small pieces for Graffiti Sokak
export const ACC = { lime: '#C6FF3D', pink: '#FF2D9B', cyan: '#17E1F2' };

export function Sticker({ children, color = ACC.lime, className = '', rot = -3 }) {
  return (
    <span
      className={`sticker f-mono text-[11px] font-bold uppercase tracking-wider ${className}`}
      style={{ background: color, transform: `rotate(${rot}deg)` }}
    >
      {children}
    </span>
  );
}

export function Marquee({ text = 'BUGÜN · 92 G PROTEİN · 5760 ADIM · ', color = ACC.lime }) {
  const chunk = Array.from({ length: 4 }, () => text).join('');
  return (
    <div
      className="marquee border-y-2 border-black py-1.5 -mx-5 -rotate-2"
      style={{ background: color }}
      aria-label={text}
    >
      <div className="marquee__track f-bang text-[22px] leading-none text-black">
        <span aria-hidden="true" className="pr-2">{chunk}</span>
        <span aria-hidden="true" className="pr-2">{chunk}</span>
      </div>
    </div>
  );
}

export function SectionHead({ kicker, title, color = ACC.lime }) {
  return (
    <div className="flex items-end justify-between mb-3">
      <h2 className="f-bang text-[30px] leading-none text-g-ink">{title}</h2>
      {kicker && <Sticker color={color}>{kicker}</Sticker>}
    </div>
  );
}

export function Bar({ value, max, color = ACC.lime }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div
      className="h-3 w-full bg-black border-2 border-black relative overflow-hidden"
      style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.14)' }}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemax={max}
    >
      <div
        className="h-full"
        style={{
          width: `${pct}%`,
          background: `repeating-linear-gradient(-45deg, ${color} 0 6px, ${color}cc 6px 9px)`,
        }}
      />
    </div>
  );
}

export function Card({ children, glow = ACC.lime, className = '' }) {
  return (
    <div
      className={`corner-glow overflow-hidden bg-g-soft border border-g-edge rounded-[14px] p-4 ${className}`}
      style={{ '--glow': glow }}
    >
      {children}
    </div>
  );
}
