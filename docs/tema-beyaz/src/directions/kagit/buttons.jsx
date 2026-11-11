/* Kâğıt button set — no shadows; pill, outline, underline. `pressed` forces the active look for the spec panel. */

const base = 'h-[48px] px-6 rounded-full text-[15px] font-semibold transition-colors disabled:cursor-not-allowed';

export function Primary({ children = 'Kaydet', pressed, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`${base} text-paper ${pressed ? 'bg-[#C9472C]' : 'bg-terra hover:bg-[#D9512F] active:bg-[#C9472C]'}
        disabled:bg-ink/10 disabled:text-ink/35`}
    >
      {children}
    </button>
  );
}

export function Secondary({ children = 'Düzenle', pressed, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`${base} border-[1.5px] border-ink text-ink ${pressed ? 'bg-ink text-paper' : 'hover:bg-ink/5 active:bg-ink active:text-paper'}
        disabled:border-ink/20 disabled:text-ink/30 disabled:bg-transparent`}
    >
      {children}
    </button>
  );
}

export function Ghost({ children = 'Atla', pressed, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`h-[48px] px-1 text-[15px] font-semibold underline underline-offset-[6px] transition-colors
        ${pressed ? 'decoration-terra decoration-2 text-terra' : 'decoration-ink/40 hover:decoration-terra active:text-terra'}
        disabled:text-ink/30 disabled:decoration-ink/15 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

export function Destructive({ children = 'Veri sil', pressed, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`${base} border-2 border-[#A33A22] ${pressed ? 'bg-[#8A2F1B] border-[#8A2F1B] text-paper' : 'text-[#A33A22] hover:bg-[#A33A22] hover:text-paper'}
        disabled:border-ink/20 disabled:text-ink/30 disabled:bg-transparent`}
    >
      {children}
    </button>
  );
}

export function IconBtn({ pressed, disabled, label = 'Geri' }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      className={`w-[48px] h-[48px] rounded-full border-[1.5px] flex items-center justify-center transition-colors
        ${pressed ? 'bg-ink text-paper border-ink' : 'border-ink text-ink hover:bg-ink/5'}
        disabled:border-ink/20 disabled:text-ink/30 disabled:bg-transparent disabled:cursor-not-allowed`}
    >
      <svg width="16" height="10" viewBox="0 0 16 10" aria-hidden="true">
        <rect x="3" y="4.25" width="13" height="1.5" fill="currentColor" />
        <path d="M6 0.5 1 5l5 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </button>
  );
}
