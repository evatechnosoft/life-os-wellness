import { useState } from 'react';

/* Segmented control — typographic tabs riding on a hairline, terracotta underline */
export function Segment({ items = ['Gün', 'Hafta', 'Ay'], value, onChange, disabled = false, pressedIdx = -1 }) {
  const [inner, setInner] = useState(value ?? items[0]);
  const cur = value ?? inner;
  return (
    <div role="radiogroup" className={`relative inline-flex border-b hair ${disabled ? 'opacity-40' : ''}`}>
      {items.map((it, i) => {
        const on = it === cur;
        return (
          <button
            key={it}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={disabled}
            onClick={() => (onChange ? onChange(it) : setInner(it))}
            className={`relative px-4 h-10 text-[15px] transition-colors disabled:cursor-not-allowed
              ${on ? 'text-ink font-semibold' : 'text-ink/55 hover:text-ink'}
              ${pressedIdx === i ? 'bg-ink/[0.06]' : ''}`}
          >
            {on ? <span className="font-fraunces italic text-[17px] font-medium">{it}</span> : it}
            <span
              aria-hidden="true"
              className={`absolute left-3 right-3 -bottom-px h-[2px] transition-colors ${on ? 'bg-terra' : 'bg-transparent'}`}
            />
          </button>
        );
      })}
    </div>
  );
}

/* Chip — ink outline when off, filled ink with a terracotta dot when on */
export function Chip({ children, on = false, pressed = false, disabled = false, onClick }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={disabled}
      onClick={onClick}
      className={`h-9 px-4 rounded-full border text-[14px] inline-flex items-center gap-2 transition-colors
        ${on ? 'bg-ink text-paper border-ink' : 'border-ink/70 text-ink hover:bg-ink/5'}
        ${pressed ? (on ? 'bg-[#000]' : 'bg-ink/10') : ''}
        disabled:border-ink/20 disabled:text-ink/30 disabled:bg-transparent disabled:cursor-not-allowed`}
    >
      {on && <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-terra" />}
      {children}
    </button>
  );
}

/* Toggle — flat track, square-ish knob, olive when on */
export function Toggle({ on: initial = false, pressed = false, disabled = false, label = 'Anahtar' }) {
  const [on, setOn] = useState(initial);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => setOn((v) => !v)}
      className={`relative w-[52px] h-[30px] rounded-full border transition-colors
        ${on ? 'bg-olive border-olive' : 'bg-transparent border-ink/70'}
        disabled:border-ink/20 disabled:bg-ink/5 disabled:cursor-not-allowed`}
    >
      <span
        aria-hidden="true"
        className={`absolute top-[3px] h-[22px] rounded-full transition-all
          ${pressed ? 'w-[28px]' : 'w-[22px]'}
          ${on ? 'bg-paper' : 'bg-ink'}
          ${disabled ? '!bg-ink/25' : ''}`}
        style={{ left: on ? (pressed ? 19 : 25) : 3 }}
      />
    </button>
  );
}
