import { useState } from 'react';

// Neon Afiş controls: 3px ink border, flat neon fill, square corners.
// Press = translate(2px,2px) + shadow off (see .btn-hard in poster.css).
const VARIANTS = {
  primary: 'btn-hard bg-p-lime text-p-ink',
  secondary: 'btn-hard bg-p-paper text-p-ink hover:bg-p-cyan [&.is-pressed]:bg-p-cyan',
  ghost:
    'text-p-ink px-1 border-b-[3px] border-p-ink hover:bg-p-lime active:translate-x-[2px] active:translate-y-[2px] [&.is-pressed]:translate-x-[2px] [&.is-pressed]:translate-y-[2px] [&.is-pressed]:bg-p-lime disabled:text-[rgba(10,10,10,.5)] disabled:border-dashed disabled:border-[rgba(10,10,10,.4)] disabled:cursor-not-allowed disabled:bg-transparent',
  danger: 'btn-hard bg-p-pink text-p-ink',
};

export function Btn({ variant = 'primary', pressed, className = '', children, icon: Icon, ...rest }) {
  return (
    <button
      className={`f-anyc text-[19px] uppercase tracking-wide leading-none px-5 h-[52px] inline-flex items-center justify-center gap-2 ${VARIANTS[variant]} ${pressed ? 'is-pressed' : ''} ${className}`}
      {...rest}
    >
      {children}
      {Icon && <Icon width={20} height={20} />}
    </button>
  );
}

export function IconBtn({ icon: Icon, label, pressed, className = '', ...rest }) {
  return (
    <button
      aria-label={label}
      className={`btn-hard w-12 h-12 grid place-items-center bg-p-cyan text-p-ink ${pressed ? 'is-pressed' : ''} ${className}`}
      {...rest}
    >
      <Icon width={22} height={22} />
    </button>
  );
}

export function Fab({ icon: Icon, label, pressed, ...rest }) {
  return (
    <button
      aria-label={label}
      className={`btn-hard w-[60px] h-[60px] bg-p-pink text-p-ink grid place-items-center ${pressed ? 'is-pressed' : ''}`}
      {...rest}
    >
      <Icon width={28} height={28} />
    </button>
  );
}

export function Chip({ on: initial = false, pressed, disabled, children, color = '#C6FF3D' }) {
  const [on, setOn] = useState(initial);
  return (
    <button
      aria-pressed={on}
      disabled={disabled}
      onClick={() => setOn((v) => !v)}
      className={`f-mono text-[12px] font-bold uppercase h-9 px-3 border-[3px] border-p-ink inline-flex items-center gap-1.5 transition-transform active:translate-x-[2px] active:translate-y-[2px] ${pressed ? 'translate-x-[2px] translate-y-[2px]' : ''} disabled:border-dashed disabled:text-[rgba(10,10,10,.5)] disabled:cursor-not-allowed`}
      style={{ background: disabled ? '#dcdbd4' : on ? color : 'transparent' }}
    >
      <i aria-hidden className="w-2.5 h-2.5 border-2 border-current block" style={{ background: on ? 'currentColor' : 'transparent' }} />
      {children}
    </button>
  );
}

export function Toggle({ on: initial = false, disabled, pressed, label }) {
  const [on, setOn] = useState(initial);
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => setOn((v) => !v)}
      className={`relative w-[64px] h-[34px] border-[3px] border-p-ink grid grid-cols-2 f-mono text-[10px] font-bold disabled:border-dashed disabled:cursor-not-allowed ${pressed ? 'translate-x-[2px] translate-y-[2px]' : ''}`}
      style={{ background: disabled ? '#dcdbd4' : on ? '#C6FF3D' : '#F4F4F0' }}
    >
      <span aria-hidden className="grid place-items-center text-[rgba(10,10,10,.7)]">{on ? '' : ''}</span>
      <span aria-hidden className="grid place-items-center text-[rgba(10,10,10,.7)]" />
      <span
        aria-hidden
        className="absolute top-0 bottom-0 w-[29px] grid place-items-center transition-all"
        style={{ left: on ? 29 : 0, background: disabled ? 'rgba(10,10,10,.4)' : '#0A0A0A', color: on ? '#C6FF3D' : '#F4F4F0' }}
      >
        {on ? 'AÇ' : 'KP'}
      </span>
    </button>
  );
}

export function Segmented({ options, value: initial, onChange, disabled, pressedIdx, label = 'Dönem' }) {
  const [val, setVal] = useState(initial ?? options[0]);
  return (
    <div
      role="tablist"
      aria-label={label}
      className={`grid border-[3px] border-p-ink ${disabled ? 'border-dashed bg-[#dcdbd4]' : 'bg-p-paper'}`}
      style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
    >
      {options.map((o, i) => {
        const act = val === o;
        return (
          <button
            key={o}
            role="tab"
            aria-selected={act}
            disabled={disabled}
            onClick={() => { setVal(o); onChange?.(o); }}
            className={`f-anyc text-[16px] uppercase h-10 border-r-[3px] border-p-ink last:border-r-0 disabled:cursor-not-allowed disabled:text-[rgba(10,10,10,.5)] ${pressedIdx === i ? 'bg-p-cyan' : ''}`}
            style={act ? { background: disabled ? 'rgba(10,10,10,.35)' : '#0A0A0A', color: disabled ? '#F4F4F0' : '#C6FF3D' } : undefined}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}
