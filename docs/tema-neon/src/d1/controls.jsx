import { useState } from 'react';

// Graffiti Sokak buttons: Bangers uppercase, sticker offset shadows.
const VARIANTS = {
  primary: 'btn-stk cta-sheen bg-g-lime text-black disabled:bg-[#3a3f2a] disabled:text-[#8c917c]',
  secondary:
    'border-2 border-g-cyan text-g-cyan bg-transparent hover:bg-g-cyan/10 active:bg-g-cyan active:text-black [&.is-pressed]:bg-g-cyan [&.is-pressed]:text-black disabled:border-[#2e4a4d] disabled:text-[#5f7d80]',
  ghost:
    'text-g-ink underline decoration-g-lime decoration-[3px] underline-offset-[6px] hover:decoration-g-pink active:text-g-lime [&.is-pressed]:text-g-lime disabled:text-[#6b6b68] disabled:decoration-[#3a3a38]',
  danger: 'btn-stk bg-g-pink text-black disabled:bg-[#4a2338] disabled:text-[#a0738a]',
};

export function Btn({ variant = 'primary', pressed, className = '', children, icon: Icon, ...rest }) {
  return (
    <button
      className={`f-bang text-[22px] leading-none px-5 h-[52px] rounded-[10px] inline-flex items-center justify-center gap-2 ${VARIANTS[variant]} ${pressed ? 'is-pressed' : ''} ${className}`}
      {...rest}
    >
      {Icon && <Icon width={20} height={20} />}
      {children}
    </button>
  );
}

export function IconBtn({ icon: Icon, label, pressed, className = '', ...rest }) {
  return (
    <button
      aria-label={label}
      className={`btn-stk w-12 h-12 grid place-items-center rounded-[10px] bg-g-paper text-black disabled:bg-[#2a2a2a] disabled:text-[#6b6b68] ${pressed ? 'is-pressed' : ''} ${className}`}
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
      className={`btn-stk w-16 h-16 rotate-[-6deg] rounded-[12px] bg-g-lime text-black grid place-items-center disabled:bg-[#3a3f2a] disabled:text-[#8c917c] ${pressed ? 'is-pressed' : ''}`}
      {...rest}
    >
      <Icon width={30} height={30} />
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
      className={`f-mono text-[12px] font-bold uppercase h-9 px-3 rounded-full border-2 transition-transform active:scale-95 ${pressed ? 'scale-95' : ''} disabled:opacity-40 disabled:cursor-not-allowed`}
      style={on ? { background: color, color: '#000', borderColor: '#000', boxShadow: '2px 2px 0 #000' } : { borderColor: 'rgba(255,255,255,.28)', color: '#F4F4F0' }}
    >
      {on ? '✓ ' : '+ '}
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
      className={`relative w-[60px] h-[32px] border-2 border-black rounded-[6px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${pressed ? 'scale-95' : ''}`}
      style={{ background: on ? '#C6FF3D' : '#2a2a2a', boxShadow: '2px 2px 0 #000' }}
    >
      <span
        className="absolute top-[3px] w-[22px] h-[22px] rounded-[4px] border-2 border-black transition-all f-mono text-[9px] font-bold grid place-items-center"
        style={{ left: on ? 31 : 3, background: on ? '#000' : '#F4F4F0', color: on ? '#C6FF3D' : '#000' }}
      >
        {on ? 'AÇ' : 'KP'}
      </span>
    </button>
  );
}

export function Segmented({ options, value: initial, onChange, disabled, pressedIdx, label = 'Dönem' }) {
  const [val, setVal] = useState(initial ?? options[0]);
  return (
    <div role="tablist" aria-label={label} className={`flex border-2 border-black bg-black rounded-[10px] p-1 gap-1 ${disabled ? 'opacity-40' : ''}`} style={{ boxShadow: '3px 3px 0 #000, inset 0 0 0 1px rgba(255,255,255,.14)' }}>
      {options.map((o, i) => {
        const act = val === o;
        return (
          <button
            key={o}
            role="tab"
            aria-selected={act}
            disabled={disabled}
            onClick={() => { setVal(o); onChange?.(o); }}
            className={`flex-1 f-bang text-[20px] h-10 rounded-[6px] transition-transform disabled:cursor-not-allowed ${pressedIdx === i ? 'translate-y-[2px]' : ''}`}
            style={act ? { background: '#C6FF3D', color: '#000', transform: 'rotate(-2deg)' } : { color: 'rgba(244,244,240,.74)' }}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}
