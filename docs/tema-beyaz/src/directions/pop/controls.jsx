import { useState } from 'react';
import { Icon } from './parts.jsx';

/** Segmented control — ink track, lime sliding pill */
export function Segment({ options = ['Gün', 'Hafta', 'Ay'], value, onChange, pressedIdx = -1, disabled }) {
  const [inner, setInner] = useState(value ?? options[0]);
  const cur = value ?? inner;
  const idx = options.indexOf(cur);
  const set = (o) => { setInner(o); onChange?.(o); };
  return (
    <div
      role="radiogroup" aria-label="Zaman aralığı" aria-disabled={disabled || undefined}
      className={`relative grid h-[48px] p-1 rounded-full bg-pop-ink ${disabled ? 'opacity-40' : ''}`}
      style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
    >
      <span
        aria-hidden="true"
        className="pop-spring absolute top-1 bottom-1 rounded-full bg-pop-lime"
        style={{ width: `calc((100% - 8px) / ${options.length})`, left: `calc(4px + ${idx} * (100% - 8px) / ${options.length})` }}
      />
      {options.map((o, i) => {
        const on = o === cur;
        return (
          <button
            key={o} type="button" role="radio" aria-checked={on} disabled={disabled}
            data-pressed={i === pressedIdx || undefined} onClick={() => set(o)}
            className={`pop-spring relative z-10 rounded-full pop-label text-[15px] disabled:cursor-not-allowed
              ${on ? 'text-pop-ink' : 'text-pop-bg'} ${i === pressedIdx && !on ? 'bg-white/15' : ''}`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

/** Filter chip — off: peach squircle; on: cobalt capsule with check */
export function Chip({ on: onProp = false, pressed, disabled, children }) {
  const [on, setOn] = useState(onProp);
  return (
    <button
      type="button" aria-pressed={on} disabled={disabled} data-pressed={pressed || undefined}
      onClick={() => setOn((v) => !v)}
      className={`pop-spring inline-flex items-center gap-1.5 h-[40px] px-4 pop-label text-[14px]
        ${on ? 'rounded-full bg-pop-cobalt text-white' : 'rounded-[14px] bg-pop-peach text-pop-ink'}
        disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {on && <Icon name="check" size={16} stroke={3.5} />}
      {children}
    </button>
  );
}

/** Toggle — chunky track, thumb grows when on (M3 Expressive) */
export function Toggle({ on: onProp = false, pressed, disabled, label }) {
  const [on, setOn] = useState(onProp);
  return (
    <button
      type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled}
      data-pressed={pressed || undefined} onClick={() => setOn((v) => !v)}
      className={`pop-spring relative w-[64px] h-[36px] rounded-full border-[3px] border-pop-ink
        ${on ? 'bg-pop-lime' : 'bg-pop-bg'} disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      <span
        aria-hidden="true"
        className={`pop-spring absolute top-1/2 -translate-y-1/2 rounded-full bg-pop-ink flex items-center justify-center text-pop-lime
          ${on ? 'left-[30px] w-[24px] h-[24px]' : 'left-[5px] w-[16px] h-[16px]'} ${pressed ? '!w-[28px] !h-[28px]' : ''}`}
      >
        {on && <Icon name="check" size={14} stroke={4} />}
      </span>
    </button>
  );
}
