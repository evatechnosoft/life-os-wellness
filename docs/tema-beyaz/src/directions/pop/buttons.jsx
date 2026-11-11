import { Icon } from './parts.jsx';

/* Chunky 56px buttons. Shape morphs capsule → rounded-square on press (.pop-morph). */
const base =
  'pop-spring pop-morph inline-flex items-center justify-center gap-2 h-[56px] px-6 pop-label text-[16px] whitespace-nowrap disabled:cursor-not-allowed';

export function Primary({ pressed, disabled, children = 'Başlat', icon = 'play', className = '' }) {
  return (
    <button
      type="button" disabled={disabled} data-pressed={pressed || undefined}
      className={`${base} bg-pop-fill text-pop-lime disabled:bg-pop-ink/10 disabled:text-pop-ink/45 ${className}`}
    >
      {icon && <Icon name={icon} size={18} />}
      {children}
    </button>
  );
}

export function Secondary({ pressed, disabled, children = 'Planla' }) {
  return (
    <button
      type="button" disabled={disabled} data-pressed={pressed || undefined}
      className={`${base} bg-pop-lime text-pop-ink border-[3px] border-pop-ink
        disabled:bg-transparent disabled:border-pop-ink/25 disabled:text-pop-ink/40`}
    >
      {children}
    </button>
  );
}

export function Ghost({ pressed, disabled, children = 'Atla' }) {
  return (
    <button
      type="button" disabled={disabled} data-pressed={pressed || undefined}
      className={`${base} px-4 text-pop-cobalt hover:bg-pop-cobalt/10 data-[pressed=true]:bg-pop-cobalt/15 disabled:text-pop-ink/35`}
    >
      {children}
      <Icon name="arrow" size={18} />
    </button>
  );
}

export function Destructive({ pressed, disabled, children = 'Sil', className = '' }) {
  return (
    <button
      type="button" disabled={disabled} data-pressed={pressed || undefined}
      className={`${base} bg-pop-coral text-pop-ink data-[pressed=true]:bg-[#F2532F]
        disabled:bg-pop-peach/60 disabled:text-pop-ink/40 ${className}`}
    >
      <Icon name="trash" size={18} />
      {children}
    </button>
  );
}

/** Icon button — squircle that morphs to a circle when pressed */
export function IconBtn({ pressed, disabled, icon = 'bell', label = 'Bildirimler', tone = 'peach' }) {
  const tones = { peach: 'bg-pop-peach text-pop-ink', ink: 'bg-pop-fill text-pop-lime', lime: 'bg-pop-lime text-pop-ink' };
  return (
    <button
      type="button" aria-label={label} disabled={disabled} data-pressed={pressed || undefined}
      className={`pop-spring w-[56px] h-[56px] rounded-[18px] active:rounded-full data-[pressed=true]:rounded-full
        flex items-center justify-center ${tones[tone]} disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      <Icon name={icon} size={22} />
    </button>
  );
}
